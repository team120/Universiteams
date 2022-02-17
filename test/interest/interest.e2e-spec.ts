import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InterestE2EModule } from './interest.e2e.module';
import * as request from 'supertest';
import { interests } from './interest.snapshot';
import { Connection } from 'typeorm';

describe('Interest Actions (e2e)', () => {
  let app: INestApplication;
  let conn: Connection;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InterestE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('get interests', () => {
    it('should return all interests', async () => {
      await request(app.getHttpServer())
        .get('/interests')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(19);
          expect(res.body).toEqual(interests);
        });
    });
  });
});
