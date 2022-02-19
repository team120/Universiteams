import { INestApplication } from '@nestjs/common';
import { createAuthTestApp } from './auth.e2e-module';
import * as request from 'supertest';
import { Connection } from 'typeorm';

describe('auth', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeEach(async () => {
    app = await createAuthTestApp();
    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();
  });
  afterEach(async () => {
    await app.close();
  });

  describe('login', () => {
    describe('when supplied credentials are valid', () => {
      it('should return an auth token', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user1@example.com', password: 'password1' })
          .then((res) => {
            expect(res.statusCode).toBe(201);
            expect(res.body.accessToken).toMatch(/Bearer\s\w+/gm);
            expect(res.body.email).toBe('user1@example.com');
            expect(res.body.id).toBe(1);
            expect(res.body.firstName).toBe('Juan');
            expect(res.body.lastName).toBe('Rizzo');
            expect(res.body.password).not.toBeDefined();
          });
      });
    });
    describe('when supplied email is not valid', () => {
      it('should return a validation error', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user1', password: 'password1' })
          .then((res) => {
            expect(res.status).toBe(400);
            expect(res.body.message[0]).toBe('email must be an email');
            expect(res.body.accessToken).not.toBeDefined();
          });
      });
    });
    describe('when no user has that email', () => {
      it('should return unauthorized without revealing more details', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user10045654@example.com', password: 'password1' })
          .then((res) => {
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
            expect(res.body.accessToken).not.toBeDefined();
          });
      });
    });
    describe('when there is a matching user but the supplied password is incorrect', () => {
      it('should return unauthorized without revealing more details', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user1@example.com', password: 'password2' })
          .then((res) => {
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
            expect(res.body.accessToken).not.toBeDefined();
          });
      });
    });
  });
});
