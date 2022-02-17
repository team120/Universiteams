import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepository } from 'typeorm';
import { Seed } from '../../src/database/seed';
import { Institution } from '../../src/institution/institution.entity';
import { Project } from '../../src/project/project.entity';
import { commonImportsArray } from '../utils/common-imports.e2e';

describe('seed removeSeedDbData e2e', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...commonImportsArray],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    const seed = new Seed();

    await seed.seedDbData();
    await app.close();
  });

  it('should erase every element introduced by seedDbData()', async () => {
    const seed = new Seed();

    await seed.removeSeedDbData();

    expect(await getRepository(Project).count()).toBe(0);
    expect(await getRepository(Institution).count()).toBe(0);
  });
});
