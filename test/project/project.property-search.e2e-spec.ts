import { INestApplication } from '@nestjs/common';
import { addMonths, formatISO, subMonths } from 'date-fns';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { createProjectTestingApp } from './project.e2e.module';
import {
  projectGeolocationWithExtendedDta,
  projects,
} from './project.snapshot';
import * as cookieParser from 'cookie-parser';

describe('Project Actions (e2e)', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    app.use(cookieParser());

    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await app.close();
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
                  'Estrategias para el dise??o ??ptimo de procesos sustentables considerando la valorizaci??n de subproductos y la incorporaci??n de energ??as renovables',
                  'Dise??o Ergonom??trico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusi??n Acad??mica',
                  'Evaluaci??n de la Actividad Total de Sulfataci??n en la Atm??sfera de la Ciudad de Rosario y de la Regi??n Industrial al Norte de la Misma',
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
                  'Caracterizaci??n de Maltas de Cebada',
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
                  'Caracterizaci??n de Maltas de Cebada',
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
                'Estrategias Did??cticas Diversas y Contextualizadas para la Ense??anza de la F??sica en Carreras de Ingenier??a',
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
                'Estrategias Did??cticas Diversas y Contextualizadas para la Ense??anza de la F??sica en Carreras de Ingenier??a',
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
                        'Perfeccionamiento de un Datalogger para Medici??n de Vientos con fines Energ??ticos',
                        'Estrategias de Modelado de Procesos bajo la Filosof??a de Dise??o Inherentemente Seguro',
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
                    'Dise??o Ergonom??trico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusi??n Acad??mica',
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
