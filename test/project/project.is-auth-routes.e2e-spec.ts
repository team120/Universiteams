import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { CurrentUserDto } from '../../src/auth/dtos/current-user.dto';
import { Bookmark } from '../../src/bookmark/bookmark.entity';
import { Project } from '../../src/project/project.entity';
import { createProjectTestingApp } from './project.e2e.module';
import * as cookieParser from 'cookie-parser';
import * as setCookieParser from 'set-cookie-parser';
import { TokenExpirationTimesFake } from '../utils/token-expiration-times.fake';

describe('Project Actions (e2e)', () => {
  let app: INestApplication;
  let conn: Connection;
  let tokenExpirationTimes: TokenExpirationTimesFake;

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    app.use(cookieParser());

    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();

    tokenExpirationTimes = testingAppCreationResult.tokenExpirationTimesTesting;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Bookmark', () => {
    describe('when token', () => {
      describe('is valid and the project: ', () => {
        const projectId = 1;
        let loginResult: CurrentUserDto;
        let accessTokenCookie: string;
        beforeEach(async () => {
          const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user1@example.com', password: 'Password_1' });
          loginResult = res.body;
          accessTokenCookie = res.header['set-cookie'][0];
        });
        describe("hasn't been already bookmarked by user", () => {
          it('should return status code 201 and the bookmark should be reflected in db', async () => {
            const res = await request(app.getHttpServer())
              .post(`/projects/bookmark/${projectId}`)
              .set('Cookie', accessTokenCookie);
            expect(res.status).toBe(201);

            const bookmark = await conn
              .getRepository(Bookmark)
              .findOne({ projectId: projectId, userId: loginResult.id });
            expect(bookmark.projectId).toBeDefined();
          });
        });
        describe('has been already bookmarked by user', () => {
          it('should return status code 201 and the bookmark should be reflected in db', async () => {
            await request(app.getHttpServer())
              .post(`/projects/bookmark/${projectId}`)
              .set('Cookie', accessTokenCookie);

            const secondBookmarkTryRes = await request(app.getHttpServer())
              .post(`/projects/bookmark/${projectId}`)
              .set('Cookie', accessTokenCookie);
            expect(secondBookmarkTryRes.status).toBe(400);
            expect(secondBookmarkTryRes.body.message).toBe(
              'This project has been already bookmarked by this user',
            );

            const bookmarkCount = await conn
              .getRepository(Bookmark)
              .count({ projectId: projectId, userId: loginResult.id });
            expect(bookmarkCount).toBe(1);
          });
        });
        afterEach(async () => {
          const project = await conn.getRepository(Project).findOne(projectId);
          expect(project.bookmarkCount).toBe(1);

          await conn
            .getRepository(Bookmark)
            .delete({ projectId: projectId, userId: loginResult.id });
          await conn
            .getRepository(Project)
            .update(projectId, { bookmarkCount: project.bookmarkCount - 1 });
        });
      });
      describe('is not sent', () => {
        it('should return Unauthorized', async () => {
          await request(app.getHttpServer())
            .post('/projects/bookmark/1')
            .then((res) => {
              expect(res.status).toBe(401);
              expect(res.body.message).toBe('Unauthorized');
            });
        });
      });
      describe('is not a valid jwt', () => {
        it.each([
          '',
          ' ',
          'accessToken=Bearer%20eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlciI6Ikp1YW4gUml6em8iLCJlbWFpbxQGV4YW1wbGUuY29tIiwiaWF0IjoxNjQ1NDIxMDB9.4IMEns6VuUJhYz_kgCn1PbMX_cAD_t2sfVXPQIHNqlk; Path=/; Expires=Thu, 24 Feb 2022 08:11:16 GMT; HttpOnly; SameSite=Strict',
        ])('should return Unauthorized', async (cookie: string) => {
          await request(app.getHttpServer())
            .post('/projects/bookmark/1')
            .set('Cookie', cookie)
            .then((res) => {
              expect(res.status).toBe(401);
              expect(res.body.message).toBe('Unauthorized');
            });
        });
      });
      describe('is expired', () => {
        const projectId = 1;
        let loginResult: CurrentUserDto;
        let expiredAccessTokenCookie: string;
        let validRefreshTokenCookie: string;

        beforeEach(async () => {
          tokenExpirationTimes.set({
            accessToken: { value: 0, dimension: 'seconds' },
          });

          const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user1@example.com', password: 'Password_1' });
          loginResult = res.body;
          expiredAccessTokenCookie = res.header['set-cookie'][0];
          validRefreshTokenCookie = res.header['set-cookie'][1];

          tokenExpirationTimes.restore();
        });
        describe('and refresh token: ', () => {
          describe('is valid', () => {
            it('should bookmark the project and provide fresh tokens as response cookies', async () => {
              const res = await request(app.getHttpServer())
                .post(`/projects/bookmark/${projectId}`)
                .set(
                  'Cookie',
                  `${validRefreshTokenCookie}; ${expiredAccessTokenCookie}`,
                );

              expect(res.status).toBe(201);

              const bookmark = await conn
                .getRepository(Bookmark)
                .findOne({ projectId: projectId, userId: loginResult.id });
              expect(bookmark.projectId).toBeDefined();

              const newAccessTokenCookie = setCookieParser.parse(
                res.header['set-cookie'][0],
              )[0];

              expect(newAccessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
              expect(newAccessTokenCookie.httpOnly).toBe(true);
              expect(newAccessTokenCookie.sameSite).toBe('Strict');
            });
            afterEach(async () => {
              const project = await conn
                .getRepository(Project)
                .findOne(projectId);
              expect(project.bookmarkCount).toBe(1);

              await conn
                .getRepository(Bookmark)
                .delete({ projectId: projectId, userId: loginResult.id });
              await conn.getRepository(Project).update(projectId, {
                bookmarkCount: project.bookmarkCount - 1,
              });
            });
          });
          describe('is invalid since', () => {
            describe('is not provided', () => {
              it('should return Unauthorized', async () => {
                await request(app.getHttpServer())
                  .post(`/projects/bookmark/${projectId}`)
                  .set('Cookie', expiredAccessTokenCookie)
                  .then((res) => {
                    expect(res.status).toBe(401);
                    expect(res.body.message).toBe('Unauthorized');
                  });
              });
            });
            describe('is expired', () => {
              let expiredRefreshTokenCookie: string;
              beforeEach(async () => {
                tokenExpirationTimes.set({
                  refreshToken: { value: 0, dimension: 'seconds' },
                });

                const res = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'user1@example.com', password: 'Password_1' });
                expiredRefreshTokenCookie = res.header['set-cookie'][1];

                tokenExpirationTimes.restore();
              });
              it('should return Unauthorized', async () => {
                await request(app.getHttpServer())
                  .post(`/projects/bookmark/${projectId}`)
                  .set('Cookie', expiredAccessTokenCookie)
                  .set('Cookie', expiredRefreshTokenCookie)
                  .then((res) => {
                    expect(res.status).toBe(401);
                    expect(res.body.message).toBe('Unauthorized');
                  });
              });
            });
            describe('is incorrectly formatted', () => {
              it('should return Unauthorized', async () => {
                await request(app.getHttpServer())
                  .post(`/projects/bookmark/${projectId}`)
                  .set('Cookie', expiredAccessTokenCookie)
                  .set(
                    'Cookie',
                    'refreshToken=Bearer%20esadsadasweqwqyJhbGciOiJIUzI1NiIasdadasdsadsadsadsadsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlciI6Ikp1YW4gUml6em8iLCJlbWFpbCI6InVzZXIxQGV4YW1wbGUuY29tIiwiaWF0IjoxNjQ1OTQzODAzLCJleHAiOjE2NDU5NDM4MTN9.XRF-Ltd4LBaZuIMvCGZCAWkJXc689zRenNpy5jU4QNA; Path=/; Expires=Sun, 27 Feb 2022 06:36:53 GMT; HttpOnly; SameSite=Strict',
                  )
                  .then((res) => {
                    expect(res.status).toBe(401);
                    expect(res.body.message).toBe('Unauthorized');
                  });
              });
            });
            afterEach(async () => {
              const bookmark = await conn
                .getRepository(Bookmark)
                .findOne({ projectId: projectId, userId: loginResult.id });
              expect(bookmark).not.toBeDefined();
            });
          });
        });
      });
    });
  });
});
