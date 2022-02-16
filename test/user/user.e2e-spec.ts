import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { UserE2EModule } from './user.e2e.module';
import * as request from 'supertest';
import { users } from './user.snapshot';
import { Connection } from 'typeorm';

describe('User Actions (e2e)', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();
  });

  afterEach(async () => {
    for (let i = 0; i < conn.migrations.length; i++) {
      await conn.undoLastMigration();
    }
    await app.close();
  });

  describe('get users', () => {
    it('should return all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toHaveLength(20);
          expect(res.body[0]).not.toHaveProperty('password');
          expect(res.body).toEqual(users);
        });
    });
  });
});
