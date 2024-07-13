import { INestApplication } from '@nestjs/common';
import { addMonths, formatISO, subMonths } from 'date-fns';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createProjectTestingApp } from './project.e2e.module';
import * as cookieParser from 'cookie-parser';

describe('Project Actions (e2e)', () => {
  let app: INestApplication;
  let conn: DataSource;

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    app.use(cookieParser());

    await app.init();

    conn = app.get(DataSource);
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
          expect(res.body.message).toBe(
            'El ID no coincide con ningún proyecto',
          );
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
                .get('/projects?sortBy=name&order=ASC&offset=0&limit=5')
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
                .get('/projects?sortBy=name&order=ASC&offset=10&limit=5')
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
                .get('/projects?sortBy=name&order=DESC&offset=0&limit=5')
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
                .get('/projects?sortBy=name&order=DESC&offset=10&limit=5')
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
              .get('/projects?sortBy=creationDate&order=ASC&offset=0&limit=5')
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
              .get('/projects?sortBy=creationDate&order=ASC&offset=10&limit=5')
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
              .get('/projects?sortBy=creationDate&order=DESC&offset=0&limit=5')
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
              .get('/projects?sortBy=creationDate&order=DESC&offset=10&limit=5')
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
});
