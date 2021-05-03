import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionE2EModule } from './interest.e2e.module';
import * as request from 'supertest';
import { interests } from './interest.snapshot';

describe('Institution Actions (e2e)', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [InstitutionE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    app.close();
  });

  describe('get interests', () => {
    it('should return all interests', async () => {
      await request(app.getHttpServer())
        .get('/interest')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(5);
          expect(res.body).toEqual(interests);
        });
    });
    it('should return the specified interest', async () => {
      const id = 1;
      await request(app.getHttpServer())
        .get(`interests/${id}`)
        .then((res) => {
          expect(res.status).toBe(200);
            expect(res.body).toEqual(interests.filter((e) => e.id === id).pop());
        });
    });
  });
});
