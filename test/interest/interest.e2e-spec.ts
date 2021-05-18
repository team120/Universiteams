import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InterestE2EModule } from './interest.e2e.module';
import * as request from 'supertest';
import { interests } from './interest.snapshot';

describe('Interest Actions (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InterestE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
          expect(res.body).toHaveLength(5);
          expect(res.body).toEqual(interests);
        });
    });
  });
});
