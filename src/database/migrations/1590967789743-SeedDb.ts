import { MigrationInterface } from 'typeorm';
import { Seed } from '../seed';

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    const seed = new Seed();
    await seed.seedDbData();
  }

  public async down(): Promise<void> {
    const seed = new Seed();
    await seed.removeSeedDbData();
  }
}
