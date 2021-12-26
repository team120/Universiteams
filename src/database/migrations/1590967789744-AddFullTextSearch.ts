import { MigrationInterface, QueryRunner } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';

export class AddFullTextSeach1590967789744 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {    
    await queryRunner.query(`
      DROP TABLE IF EXISTS project_with_related_data;
      CREATE TEMP TABLE IF NOT EXISTS project_with_related_data AS
      SELECT
        p.id,
        setweight(to_tsvector(coalesce(p.name, '')), 'A') || 
        setweight(to_tsvector(coalesce(p.type, '')), 'A') ||
        setweight(to_tsvector(coalesce(rd.name, '')), 'B') ||
        setweight(to_tsvector(coalesce(rd.abbreviation, '')), 'B') ||
        setweight(to_tsvector(coalesce(f.name, '')), 'B') ||
        setweight(to_tsvector(coalesce(f.abbreviation, '')), 'B') ||
        setweight(to_tsvector(coalesce(inst.name, '')), 'B') ||
        setweight(to_tsvector(coalesce(inst.abbreviation, '')), 'B') ||
        setweight(to_tsvector(coalesce(string_agg(usr.name || ' ' || usr."lastName", ' '), '')), 'C') ||
        setweight(to_tsvector(coalesce(string_agg(inter.name, ' '), '')), 'C') as document_with_weights
      FROM project p
      INNER JOIN research_department rd
        ON p."researchDepartmentId" = rd.id
      INNER JOIN facility f
        ON rd."facilityId" = f.id
      INNER JOIN institution inst
        ON f."institutionId" = inst.id
      INNER JOIN interest_projects_project ip
        ON ip."projectId" = p.id
      INNER JOIN interest inter
        ON ip."interestId" = inter.id
      INNER JOIN enrollment enr
        ON p.id = enr."projectId"
      INNER JOIN "user" usr
        ON enr."userId" = usr.id
      GROUP BY 
        p.id,
        rd.id,
        f.id,
        inst.id;

      UPDATE project as p
      SET document_with_weights = pwrd.document_with_weights
      FROM project_with_related_data pwrd
      WHERE p.id = pwrd.id;

      CREATE INDEX IF NOT EXISTS document_with_weights_idx
      ON project
      USING GIN(document_with_weights);

      CREATE OR REPLACE FUNCTION set_tsvector() RETURNS trigger AS $$
      BEGIN
        new.document_with_weights := (
          SELECT
            setweight(to_tsvector('simple' ,coalesce(new.name, '')), 'A') || 
            setweight(to_tsvector('simple' ,coalesce(new.type, '')), 'A') ||
            setweight(to_tsvector('simple' ,coalesce(rd.name, '')), 'B') ||
            setweight(to_tsvector('simple' ,coalesce(rd.abbreviation, '')), 'B') ||
            setweight(to_tsvector('simple' ,coalesce(f.name, '')), 'B') ||
            setweight(to_tsvector('simple' ,coalesce(f.abbreviation, '')), 'B') ||
            setweight(to_tsvector('simple' ,coalesce(inst.name, '')), 'B') ||
            setweight(to_tsvector('simple' ,coalesce(inst.abbreviation, '')), 'B') ||
            setweight(to_tsvector('simple' ,coalesce(string_agg(usr.name || ' ' || usr."lastName", ' '), '')), 'C') ||
            setweight(to_tsvector('simple' ,coalesce(string_agg(inter.name, ' '), '')), 'C') 
          FROM project
          INNER JOIN research_department rd
            ON new."researchDepartmentId" = rd.id
          INNER JOIN facility f
            ON rd."facilityId" = f.id
          INNER JOIN institution inst
            ON f."institutionId" = inst.id
          INNER JOIN interest_projects_project ip
            ON ip."projectId" = new.id
          INNER JOIN interest inter
            ON ip."interestId" = inter.id
          INNER JOIN enrollment enr
            ON new.id = enr."projectId"
          INNER JOIN "user" usr
            ON enr."userId" = usr.id
          GROUP BY 
            new.id,
            rd.id,
            f.id,
            inst.id
          LIMIT 1
        );
        return new;
      END
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER update_tsvector 
      AFTER INSERT OR UPDATE ON project
      FOR EACH ROW
      EXECUTE PROCEDURE set_tsvector();
    `);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}