import { INestApplication } from '@nestjs/common';
import { addMonths, formatISO, subMonths } from 'date-fns';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { CurrentUserDto } from '../../src/auth/dtos/current-user.dto';
import { Bookmark } from '../../src/bookmark/bookmark.entity';
import { Project } from '../../src/project/project.entity';
import { createProjectTestingApp } from './project.e2e.module';
import {
  projectGeolocationWithExtendedDta,
  projects,
} from './project.snapshot';
import * as cookieParser from 'cookie-parser';
import * as setCookieParser from 'set-cookie-parser';
import { TokenExpirationTimesFake } from '../utils/token-expiration-times.fake';

jest.useRealTimers();

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
            .send({ email: 'user1@example.com', password: 'password1' });
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
                  .send({ email: 'user1@example.com', password: 'password1' });
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
      describe('is valid and the project: ', () => {
        const projectId = 1;
        let loginResult: CurrentUserDto;
        let accessTokenCookie: string;
        beforeEach(async () => {
          const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'user1@example.com', password: 'password1' });
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
    });
  });

  describe('Get one', () => {
    it('should return ID not found if it does not match any id on DB', async () => {
      const id = 100;
      await request(app.getHttpServer())
        .get(`/projects/${id}`)
        .then((res) => {
          expect(res.status).toBe(404);
          expect(res.body.message).toBe('Id does not match with any project');
        });
    });
    it('should get the specified geolocation project with their associated users', async () => {
      const id = 1;
      await request(app.getHttpServer())
        .get(`/projects/${id}`)
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toEqual(projectGeolocationWithExtendedDta);
          expect(res.body.interests).toBeDefined();
          expect(res.body.enrollments[0].user.password).not.toBeDefined();
        });
    });
  });

  describe('Get all', () => {
    it('should get all projects and their associated users', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body.projects).toEqual(projects);
          expect(res.body.projects).toHaveLength(11);
          expect(res.body.projectCount).toBe(11);
        });
    });
  });

  describe('search projects by a known property', () => {
    describe('when isDown parameter is provided', () => {
      describe('and set to false', () => {
        it('should get the first page of projects and the every one counted', async () => {
          await request(app.getHttpServer())
            .get('/projects?isDown=false&offset=0&limit=5')
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(5);
              expect(res.body.projectCount).toBe(11);
            });
        });
      });

      describe('and set to true', () => {
        it('should get no projects', async () => {
          const isDown = true;
          await request(app.getHttpServer())
            .get(`/projects?isDown=${isDown}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(3);
              expect(res.body.projectCount).toBe(3);
              expect(res.body.projects.map((p) => p.name)).toEqual(
                expect.arrayContaining([
                  'Estrategias para el diseño óptimo de procesos sustentables considerando la valorización de subproductos y la incorporación de energías renovables',
                  'Diseño Ergonométrico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusión Académica',
                  'Evaluación de la Actividad Total de Sulfatación en la Atmósfera de la Ciudad de Rosario y de la Región Industrial al Norte de la Misma',
                ]),
              );
            });
        });
        it('should get no projects as well when another parameter is provided', async () => {
          const isDown = true;
          const type = 'Informal';
          await request(app.getHttpServer())
            .get(`/projects?isDown=${isDown}&type=${type}&offset=0&limit=5`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projectCount).toBe(1);
            });
        });
      });
    });
    describe('dateFrom is sent', () => {
      describe('less than a year', () => {
        it('should get the universiteams project only', async () => {
          const dateFrom = subMonths(new Date('2021-03-16'), 8);
          await request(app.getHttpServer())
            .get(
              `/projects?dateFrom=${formatISO(dateFrom, {
                representation: 'date',
              })}&offset=0&limit=5`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projectCount).toBe(1);
              expect(res.body.projects.map((p) => p.name)).toEqual([
                'Universiteams',
              ]);
            });
        });
      });
      describe('current date plus a month (future time)', () => {
        it('should get no projects (physically impossible to get other result)', async () => {
          const aMonthInTheFuture = addMonths(new Date(), 1);
          await request(app.getHttpServer())
            .get(
              `/projects?dateFrom=${formatISO(aMonthInTheFuture, {
                representation: 'date',
              })}&offset=0&limit=5`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(0);
              expect(res.body.projectCount).toBe(0);
            });
        });
      });
    });
    describe('when searching by one userId', () => {
      it('should get two projects', async () => {
        const userId = 3;
        await request(app.getHttpServer())
          .get(`/projects?userId=${userId}&offset=0&limit=5`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(2);
            expect(res.body.projects.map((p) => p.name)).toEqual(
              expect.arrayContaining([
                'Universiteams',
                'Estudio de las Estructuras Conceptuales de la Ciencia de datos',
              ]),
            );
          });
      });
    });

    describe('sorting', () => {
      describe('by project name in ascending order', () => {
        describe('when the first results page is requested', () => {
          it('should get the first projects sorted by name in that order', async () => {
            await request(app.getHttpServer())
              .get(
                '/projects?sortBy=name&inAscendingOrder=true&offset=0&limit=5',
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(5);
                expect(res.body.projects[0].name).toBe(
                  'Caracterización de Maltas de Cebada',
                );
                expect(res.body.projectCount).toBe(11);
              });
          });
        });
        describe('when the third results page is requested', () => {
          it('should get the last projects sorted by name in ascending order', async () => {
            await request(app.getHttpServer())
              .get(
                '/projects?sortBy=name&inAscendingOrder=true&offset=10&limit=5',
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(1);
                expect(res.body.projects[0].name).toBe('Universiteams');
                expect(res.body.projectCount).toBe(11);
              });
          });
        });
      });
      describe('by project name in descending order', () => {
        describe('when the first results page is requested', () => {
          it('should get the first projects sorted by name in descending order', async () => {
            await request(app.getHttpServer())
              .get(
                '/projects?sortBy=name&inAscendingOrder=false&offset=0&limit=5',
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(5);
                expect(res.body.projects[0].name).toBe('Universiteams');
                expect(res.body.projectCount).toBe(11);
              });
          });
        });
        describe('when the third results page is requested', () => {
          it('should get the last projects sorted by name in descending order', async () => {
            await request(app.getHttpServer())
              .get(
                '/projects?sortBy=name&inAscendingOrder=false&offset=10&limit=5',
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(1);
                expect(res.body.projects[0].name).toBe(
                  'Caracterización de Maltas de Cebada',
                );
                expect(res.body.projectCount).toBe(11);
              });
          });
        });
      });
    });
    describe('by project creation date in ascending order', () => {
      describe('when the first results page is requested', () => {
        it('should get the first projects sorted by creation date in ascending order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=true&offset=0&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(5);
              expect(res.body.projects[0].name).toBe(
                'Estrategias Didácticas Diversas y Contextualizadas para la Enseñanza de la Física en Carreras de Ingeniería',
              );
              expect(res.body.projects[0].creationDate).toBe('2017-01-01');
              expect(res.body.projectCount).toBe(11);
            });
        });
      });
      describe('when the third results page is requested', () => {
        it('should get the last projects sorted by creation date in ascending order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=true&offset=10&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe('Universiteams');
              expect(res.body.projects[0].creationDate).toBe('2021-03-16');
              expect(res.body.projectCount).toBe(11);
            });
        });
      });
    });
    describe('by project creation date in descending order', () => {
      describe('when the first results page is requested', () => {
        it('should get the first projects sorted by creation date in descending order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=false&offset=0&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(5);
              expect(res.body.projects[0].name).toBe('Universiteams');
              expect(res.body.projects[0].creationDate).toBe('2021-03-16');
              expect(res.body.projectCount).toBe(11);
            });
        });
      });
      describe('when the third results page is requested', () => {
        it('should get the last projects sorted by creation date in descending order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=false&offset=10&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe(
                'Estrategias Didácticas Diversas y Contextualizadas para la Enseñanza de la Física en Carreras de Ingeniería',
              );
              expect(res.body.projects[0].creationDate).toBe('2017-01-01');
              expect(res.body.projectCount).toBe(11);
            });
        });
      });
    });
    describe('by dateFrom and dateUntil', () => {
      describe('when dateUntil is before dateFrom', () => {
        it('should get a validation error response (bad request)', async () => {
          await request(app.getHttpServer())
            .get(
              `/projects?dateFrom=2021-01-02&dateUntil=2021-01-01&offset=0&limit=5`,
            )
            .then((res) => {
              expect(res.status).toBe(400);
              expect(res.body.message).toEqual([
                'dateUntil is not after dateFrom',
              ]);
              expect(res.body.error).toBe('Bad Request');
              expect(res.body.projects).not.toBeDefined();
              expect(res.body.projectCount).not.toBeDefined();
            });
        });
      });
      describe('when searching for projects with a duration of', () => {
        const startingDate = '2019-01-01';
        describe(`one years from ${startingDate}`, () => {
          it.each([undefined, false])(
            'should get no projects even when is down is set to false (inputValue %p)',
            async (isDown?: boolean) => {
              const dateUntil = '2021-01-01';
              await request(app.getHttpServer())
                .get(
                  `/projects?dateFrom=${startingDate}&dateUntil=${dateUntil}&isDown=${isDown}&offset=0&limit=5`,
                )
                .then((res) => {
                  expect(res.status).toBe(200);
                  expect(res.body.projects).toHaveLength(0);
                  expect(res.body.projectCount).toBe(0);
                });
            },
          );
        });
        describe(`three years from ${startingDate}`, () => {
          const dateUntil = '2023-01-01';
          describe('without setting isDown or setting it to false', () => {
            it.each([undefined, false])(
              'should get two projects (inputValue %p)',
              async (isDown?: boolean) => {
                await request(app.getHttpServer())
                  .get(
                    `/projects?dateFrom=${startingDate}&dateUntil=${dateUntil}&isDown=${isDown}&offset=0&limit=5`,
                  )
                  .then((res) => {
                    expect(res.status).toBe(200);
                    expect(res.body.projects).toHaveLength(2);
                    expect(res.body.projectCount).toBe(2);
                    expect(res.body.projects.map((p) => p.name)).toEqual(
                      expect.arrayContaining([
                        'Perfeccionamiento de un Datalogger para Medición de Vientos con fines Energéticos',
                        'Estrategias de Modelado de Procesos bajo la Filosofía de Diseño Inherentemente Seguro',
                      ]),
                    );
                  });
              },
            );
          });
          describe('setting isDown to true', () => {
            it('should get another two project', async () => {
              await request(app.getHttpServer())
                .get(
                  `/projects?dateFrom=${startingDate}&dateUntil=${dateUntil}&isDown=true&offset=0&limit=5`,
                )
                .then((res) => {
                  expect(res.status).toBe(200);
                  expect(res.body.projects).toHaveLength(2);
                  expect(res.body.projectCount).toBe(2);
                  expect(res.body.projects[0].name).toBe(
                    'Diseño Ergonométrico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusión Académica',
                  );
                  expect(res.body.projects[0].endDate).toBe('2020-12-31');
                });
            });
          });
        });
      });
    });
  });
});
