import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { UserE2EModule } from './user.e2e.module';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

describe('User Actions (e2e)', () => {
  let app: INestApplication;
  let conn: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conn = app.get(DataSource);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('get users', () => {
    it('should return all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body.users).toHaveLength(20);
          expect(res.body.usersCount).toEqual(20);
          expect(res.body.users[0]).not.toHaveProperty('password');
        });
    });
  });
  describe('get users with pagination', () => {
    it('should return only five users when using limit', async () => {
      await request(app.getHttpServer())
        .get('/users?limit=5')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body.users).toHaveLength(5);
          expect(res.body.usersCount).toEqual(20);
          expect(res.body.users[0]).not.toHaveProperty('password');
        });
    });
  });
});
