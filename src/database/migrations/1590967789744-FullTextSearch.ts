/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class FullTextSeach1590967789744 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tsVectorQuery = (params: {
      textSearchConfig:
        | 'p.language::regconfig'
        | 'to_simple_searchconfig(p.language)';
      includeGroupByIndex: boolean;
    }) => `
    SELECT
      ${params.includeGroupByIndex ? 'p.id,' : ''}
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(p.name, ''))) || 
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(p.type, ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(rd.name, ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(rd.abbreviation, ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(f.name, ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(f.abbreviation, ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(inst.name, ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(inst.abbreviation, ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(usr.name || ' ' || usr."lastName", ' '), ''))) ||
      to_tsvector(${params.textSearchConfig}, unaccent(coalesce(string_agg(inter.name, ' '), ''))) as document_with_weights
    FROM project p
    INNER JOIN project_research_department prd
      ON p.id = prd."projectId"
    INNER JOIN research_department rd
      ON prd."researchDepartmentId" = rd.id
    INNER JOIN facility f
      ON rd."facilityId" = f.id
    INNER JOIN institution inst
      ON f."institutionId" = inst.id
    LEFT JOIN project_interest pi
      ON p.id = pi."projectId"
    LEFT JOIN interest inter
      ON pi."interestId" = inter.id
    LEFT JOIN enrollment enr
      ON p.id = enr."projectId"
    LEFT JOIN "user" usr
      ON enr."userId" = usr.id
    GROUP BY 
      p.id`;

    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS unaccent;
    
      CREATE MATERIALIZED VIEW IF NOT EXISTS project_search_index AS
      ${tsVectorQuery({
        textSearchConfig: 'p.language::regconfig',
        includeGroupByIndex: true,
      })};

      CREATE INDEX IF NOT EXISTS document_with_weights_idx
      ON project_search_index
      USING GIN(document_with_weights);

      CREATE UNIQUE INDEX IF NOT EXISTS project_search_idx
      ON project_search_index(id);

      CREATE EXTENSION IF NOT EXISTS pg_trgm;

      -- Dictionary and search configuration that includes SPANISH stop words but does not stem words
      CREATE TEXT SEARCH DICTIONARY spanish_simple_dict (
        TEMPLATE = pg_catalog.simple,
        STOPWORDS = spanish
      );
      
      CREATE TEXT SEARCH CONFIGURATION spanish_simple (COPY = simple);
      ALTER TEXT SEARCH CONFIGURATION spanish_simple
        ALTER MAPPING FOR asciiword WITH spanish_simple_dict;

      -- Dictionary and search configuration that includes ENGLISH stop words but does not stem words
      CREATE TEXT SEARCH DICTIONARY english_simple_dict (
        TEMPLATE = pg_catalog.simple,
        STOPWORDS = english
      );
      
      CREATE TEXT SEARCH CONFIGURATION english_simple (COPY = simple);
      ALTER TEXT SEARCH CONFIGURATION english_simple
        ALTER MAPPING FOR asciiword WITH english_simple_dict;

      -- Function that maps traditional search configurations to simple non-stemmed no-stop-words configs
      CREATE OR REPLACE FUNCTION to_simple_searchconfig(config character varying) RETURNS regconfig AS $$
      BEGIN
        RETURN
        CASE WHEN config = 'spanish' THEN 'spanish_simple'::regconfig
          WHEN config = 'english' THEN 'english_simple'::regconfig
        END;
      END;
      $$ LANGUAGE plpgsql;

      -- Materialized view that contains every word (without stemming) indexed in a tsvector and ignoring stop words
      CREATE MATERIALIZED VIEW IF NOT EXISTS unique_words AS
      SELECT word FROM ts_stat($$
        ${tsVectorQuery({
          textSearchConfig: 'to_simple_searchconfig(p.language)',
          includeGroupByIndex: false,
        })}				 
      $$);

      CREATE INDEX IF NOT EXISTS word_idx
      ON unique_words
      USING GIN(word gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP MATERIALIZED VIEW project_search_index;

      -- Dictionary and search configuration that includes SPANISH stop words but does not stem words
      DROP TEXT SEARCH CONFIGURATION spanish_simple;
      DROP TEXT SEARCH DICTIONARY spanish_simple_dict;
      
      -- Dictionary and search configuration that includes ENGLISH stop words but does not stem words
      DROP TEXT SEARCH CONFIGURATION english_simple;
      DROP TEXT SEARCH DICTIONARY english_simple_dict;
      
      -- Function that maps traditional search configurations to simple non-stemmed no-stop-words configs
      DROP FUNCTION to_simple_searchconfig(character varying);
      
      DROP MATERIALIZED VIEW unique_words;
      
      DROP EXTENSION pg_trgm;
      DROP EXTENSION unaccent;
    `);
  }
}
