import { MigrationInterface, QueryRunner } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';

export class AddFullTextSeach1590967789744 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {    
    await queryRunner.query(`
      CREATE EXTENSION unaccent;
    
      CREATE MATERIALIZED VIEW project_search_index AS
      SELECT
        p.id,
        setweight(to_tsvector(unaccent(coalesce(p.name, ''))), 'A') || 
        setweight(to_tsvector(unaccent(coalesce(p.type, ''))), 'A') ||
        setweight(to_tsvector(unaccent(coalesce(rd.name, ''))), 'B') ||
        setweight(to_tsvector(unaccent(coalesce(rd.abbreviation, ''))), 'B') ||
        setweight(to_tsvector(unaccent(coalesce(f.name, ''))), 'B') ||
        setweight(to_tsvector(unaccent(coalesce(f.abbreviation, ''))), 'B') ||
        setweight(to_tsvector(unaccent(coalesce(inst.name, ''))), 'B') ||
        setweight(to_tsvector(unaccent(coalesce(inst.abbreviation, ''))), 'B') ||
        setweight(to_tsvector(unaccent(coalesce(string_agg(usr.name || ' ' || usr."lastName", ' '), ''))), 'C') ||
        setweight(to_tsvector(unaccent(coalesce(string_agg(inter.name, ' '), ''))), 'C') as document_with_weights
      FROM project p
      INNER JOIN research_department rd
        ON p."researchDepartmentId" = rd.id
      INNER JOIN facility f
        ON rd."facilityId" = f.id
      INNER JOIN institution inst
        ON f."institutionId" = inst.id
      LEFT JOIN interest_projects_project ip
        ON ip."projectId" = p.id
      LEFT JOIN interest inter
        ON ip."interestId" = inter.id
      LEFT JOIN enrollment enr
        ON p.id = enr."projectId"
      LEFT JOIN "user" usr
        ON enr."userId" = usr.id
      GROUP BY 
        p.id,
        rd.id,
        f.id,
        inst.id;

      CREATE INDEX IF NOT EXISTS document_with_weights_idx
      ON project_search_index
      USING GIN(document_with_weights);

      CREATE UNIQUE INDEX IF NOT EXISTS project_search_idx
      ON project_search_index(id);
    `);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
