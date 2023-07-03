import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Seed } from '../../src/database/seed';
import { Institution } from '../../src/institution/institution.entity';
import { Project } from '../../src/project/project.entity';
import { commonImportsArray } from '../utils/common-imports.e2e';
import { DataSource } from 'typeorm';

describe('seed removeSeedDbData e2e', () => {
  let app: INestApplication;
  let conn: DataSource;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...commonImportsArray],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conn = app.get(DataSource);
  });

  afterEach(async () => {
    const seed = new Seed(conn);

    await seed.seedDbData();
    await app.close();
  });

  it('should erase every element introduced by seedDbData()', async () => {
    const seed = new Seed(conn);

    await seed.removeSeedDbData();

    expect(await conn.getRepository(Project).count()).toBe(0);
    expect(await conn.getRepository(Institution).count()).toBe(0);
  });
});
