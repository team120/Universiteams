import { MigrationInterface, QueryRunner } from 'typeorm';

// On a fresh database the seed migration synchronizes the schema from the
// entities, so these columns may already exist. Every step is idempotent.
export class EnrollmentInvitations1590967789748 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollment" ADD COLUMN IF NOT EXISTS "senderId" integer`,
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_ab2dfbbba3dac3fc922a69d7c59'
        ) THEN
          ALTER TABLE "enrollment" ADD CONSTRAINT "FK_ab2dfbbba3dac3fc922a69d7c59"
            FOREIGN KEY ("senderId") REFERENCES "user"("id")
            ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$`);
    await queryRunner.query(
      `ALTER TABLE "project" ADD COLUMN IF NOT EXISTS "senderName" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "project" DROP COLUMN IF EXISTS "senderName"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP CONSTRAINT IF EXISTS "FK_ab2dfbbba3dac3fc922a69d7c59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollment" DROP COLUMN IF EXISTS "senderId"`,
    );
  }
}
