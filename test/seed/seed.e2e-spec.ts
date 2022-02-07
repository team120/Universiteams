import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Seed } from '../../src/database/seed';
import { commonImportsArray } from '../utils/common-imports.e2e';

describe('seed removeSeedDbData e2e', () => {
  let app: INestApplication;
  beforeEach(async () => {
    /*const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [...commonImportsArray],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();*/
  });

  it('should erase every element introduced by seedDbData()', async () => {
    /*const seed = new Seed();
    expect(await seed.removeSeedDbData()).not.toThrow();*/
  });
});
