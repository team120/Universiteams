/* eslint-disable prettier/prettier */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class StopWords1590967789745 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const copyQuery = (language: 'spanish' | 'english') =>
      `COPY stop_words("language", word) FROM PROGRAM 
    'cat /usr/local/share/postgresql/tsearch_data/${language}.stop | while read line; do echo "${language},$line"; done'
    WITH DELIMITER ','`;

    await queryRunner.query(`
      ${copyQuery('spanish')};
      ${copyQuery('english')};
      
      CREATE INDEX IF NOT EXISTS stop_words_idx
      ON stop_words USING GIN(word gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS stop_words;
    `);
  }
}
