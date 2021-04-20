import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UniversityE2EModule } from './university.e2e-module';
import * as request from 'supertest';
import { universities } from './university.snapshot';

describe('University Actions (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UniversityE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    app.close();
  });

  describe('get universities', () => {
    it('should return all universities', async () => {
      await request(app.getHttpServer())
        .get('/universities')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(2);
          expect(res.body).toEqual(universities);
        });
    });
  });
});
