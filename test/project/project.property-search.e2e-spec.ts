import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
import {
  projectGeolocationWithExtendedDta,
  projects,
} from './project.snapshot';
import { ProjectE2EModule } from './project.e2e.module';

describe('Project Actions (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
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
          expect(res.body.message).toBe(`Not Found`);
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
          expect(res.body.projects).toHaveLength(14);
          expect(res.body.projectCount).toBe(14);
        });
    });
  });

  describe('search projects by a known property', () => {
    describe('when isDown parameter is provided', () => {
      describe('and set to false', () => {
        it('should get the first page of projects and the every one counted', async () => {
          const isDown = false;
          await request(app.getHttpServer())
            .get(`/projects?isDown=${isDown}&offset=0&limit=5`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(5);
              expect(res.body.projectCount).toBe(14);
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
              expect(res.body.projects).toHaveLength(0);
            });
        });
        it('should get no projects as well when another parameter is provided', async () => {
          const isDown = true;
          const type = 'Informal';
          await request(app.getHttpServer())
            .get(`/projects?isDown=${isDown}&type=${type}&offset=0&limit=5`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(0);
              expect(res.body.projectCount).toBe(0);
            });
        });
      });
    });
    describe('dateFrom is sent', () => {
      describe('less than a year', () => {
        it('should get the universiteams project only', async () => {
          const dateFrom = new Date('2021-03-16');
          dateFrom.setMonth(dateFrom.getMonth() - 8);
          await request(app.getHttpServer())
            .get(`/projects?dateFrom=${dateFrom.toISOString()}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe('Universiteams');
            });
        });
      });
      describe('current date plus a month', () => {
        it('should get no projects', async () => {
          const dateFrom = new Date();
          dateFrom.setMonth(dateFrom.getMonth() + 1);
          await request(app.getHttpServer())
            .get(`/projects?dateFrom=${dateFrom}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(0);
            });
        });
      });
    });
    describe('when searching by one userId', () => {
      it('should get one project (UPM) that exactly match one of their users', async () => {
        const userId = 3;
        await request(app.getHttpServer())
          .get(`/projects?userId=${userId}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(1);
            expect(res.body.projects[0].name).toEqual('Universiteams');
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
                expect(res.body.projectCount).toBe(14);
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
                expect(res.body.projects).toHaveLength(4);
                expect(res.body.projects[0].name).toBe(
                  'Medición de Rendimiento de Planta Fotovoltaica. Estudio Comparativo en base a Diversas Herramientas de Cálculo. Desarrollo de Aplicación de Cálculo',
                );
                expect(res.body.projectCount).toBe(14);
              });
          });
        });
      });
      describe('by project name in descending order', () => {
        describe('when the first results page is requested', () => {
          it('should get the first projects sorted by name in that order', async () => {
            await request(app.getHttpServer())
              .get(
                '/projects?sortBy=name&inAscendingOrder=false&offset=0&limit=5',
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(5);
                expect(res.body.projects[0].name).toBe('Universiteams');
                expect(res.body.projectCount).toBe(14);
              });
          });
        });
        describe('when the third results page is requested', () => {
          it('should get the last projects sorted by name in that order', async () => {
            await request(app.getHttpServer())
              .get(
                '/projects?sortBy=name&inAscendingOrder=false&offset=10&limit=5',
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(4);
                expect(res.body.projects[0].name).toBe(
                  'Diseño Ergonométrico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusión Académica',
                );
                expect(res.body.projectCount).toBe(14);
              });
          });
        });
      });
    });
    describe('by project name in ascending order', () => {
      describe('when the first results page is requested', () => {
        it('should get the first projects sorted by name in that order', async () => {
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
              expect(res.body.projects[0].creationDate).toBe(
                '2017-01-01T00:00:00.000Z',
              );
              expect(res.body.projectCount).toBe(14);
            });
        });
      });
      describe('when the third results page is requested', () => {
        it('should get the last projects sorted by name in that order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=true&offset=10&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(4);
              expect(res.body.projects[0].name).toBe(
                'Estrategias de Modelado de Procesos bajo la Filosofía de Diseño Inherentemente Seguro',
              );
              expect(res.body.projects[0].creationDate).toBe(
                '2019-01-01T00:00:00.000Z',
              );
              expect(res.body.projectCount).toBe(14);
            });
        });
      });
    });
    describe('by project creation date in descending order', () => {
      describe('when the first results page is requested', () => {
        it('should get the first projects sorted by date in that order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=false&offset=0&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(5);
              expect(res.body.projects[0].name).toBe('Universiteams');
              expect(res.body.projects[0].creationDate).toBe(
                '2021-03-16T00:00:00.000Z',
              );
              expect(res.body.projectCount).toBe(14);
            });
        });
      });
      describe('when the third results page is requested', () => {
        it('should get the last projects sorted by date in that order', async () => {
          await request(app.getHttpServer())
            .get(
              '/projects?sortBy=creationDate&inAscendingOrder=false&offset=10&limit=5',
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(4);
              expect(res.body.projects[0].name).toBe(
                'Estrategias de Diseño de Procesos de Bioingeniería Sustentables. Aplicaciones a Casos de Estudio en el marco de la bioeconomía',
              );
              expect(res.body.projects[0].creationDate).toBe(
                '2018-01-01T00:00:00.000Z',
              );
              expect(res.body.projectCount).toBe(14);
            });
        });
      });
    });
  });
});
