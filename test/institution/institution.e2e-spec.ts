import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionE2EModule } from './institution.e2e.module';
import * as request from 'supertest';
import { institutions } from './institution.snapshot';

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

  describe('get institutions', () => {
    it('should return all institutions', async () => {
      await request(app.getHttpServer())
        .get('/institutions')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(2);
          expect(res.body).toEqual(institutions);
        });
    });
  });
});