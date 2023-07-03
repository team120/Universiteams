import { MigrationInterface, QueryRunner } from 'typeorm';
import { Seed } from '../seed';

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const seed = new Seed(queryRunner.connection);
    await seed.seedDbData();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const seed = new Seed(queryRunner.connection);
    await seed.removeSeedDbData();
  }
}
