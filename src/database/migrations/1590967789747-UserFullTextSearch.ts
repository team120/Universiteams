/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserFullTextSearch1590967789747 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tsVectorQuery = () => {
      const textSearchConfig = "'spanish'::regconfig";
      const includeGroupByIndex = true;
      return `SELECT
      ${includeGroupByIndex ? 'u.id,' : ''}
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(u."firstName" || ' ' || u."lastName", ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(rd.name, ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(rd.abbreviation, ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(f.name, ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(f.abbreviation, ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(inst.name, ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(inst.abbreviation, ' '), ''))) ||
      to_tsvector(${textSearchConfig}, unaccent(coalesce(string_agg(inter.name, ' '), ''))) as document_with_weights_user
    FROM "user" u
    INNER JOIN user_affiliation uaff
        ON u.id = uaff."userId"
    
    INNER JOIN research_department rd
      ON uaff."researchDepartmentId" = rd.id
    INNER JOIN facility f
      ON rd."facilityId" = f.id
    INNER JOIN institution inst
      ON f."institutionId" = inst.id
    
    INNER JOIN user_interest uint
      ON u.id = uint."userId"
    LEFT JOIN interest inter
      ON uint."interestId" = inter.id

    LEFT JOIN enrollment enr
      ON u.id = enr."userId"
    LEFT JOIN project pro
      ON enr."projectId" = pro.id
    GROUP BY 
      u.id`;
    };

    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS unaccent;
    
      CREATE MATERIALIZED VIEW IF NOT EXISTS user_search_index AS
      ${tsVectorQuery()};

      CREATE INDEX IF NOT EXISTS document_with_weights_user_idx
      ON user_search_index
      USING GIN(document_with_weights_user);

      CREATE UNIQUE INDEX IF NOT EXISTS user_search_idx
      ON user_search_index(id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP MATERIALIZED VIEW user_search_index;

      -- Dictionary and search configuration that includes SPANISH stop words but does not stem words
      DROP TEXT SEARCH CONFIGURATION spanish_simple;
      DROP TEXT SEARCH DICTIONARY spanish_simple_dict;
      
      -- Dictionary and search configuration that includes ENGLISH stop words but does not stem words
      DROP TEXT SEARCH CONFIGURATION english_simple;
      DROP TEXT SEARCH DICTIONARY english_simple_dict;
      
      -- Function that maps traditional search configurations to simple non-stemmed no-stop-words configs
      DROP FUNCTION to_simple_searchconfig(character varying);
      
      DROP EXTENSION pg_trgm;
      DROP EXTENSION unaccent;
    `);
  }
}
