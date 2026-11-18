import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createProjectTestingApp } from './project.e2e.module';
import { DataSource } from 'typeorm';

describe('Project Actions (e2e)', () => {
  let app: INestApplication;
  let conn: DataSource;

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    await app.init();

    conn = app.get(DataSource);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('search projects by a general text search', () => {
    describe('when the term matches no project and resembles no word', () => {
      it('should return an empty list', async () => {
        const res = await request(app.getHttpServer())
          .get('/projects')
          .query({ generalSearch: 'zzzzqqq' });

        expect(res.status).toBe(200);
        expect(res.body.projects).toEqual([]);
        expect(res.body.projectCount).toBe(0);
        expect(res.body).not.toHaveProperty('suggestedSearchTerms');
      });
    });

    describe('when the term is only stop words', () => {
      it('should return an empty list with no suggestions', async () => {
        const res = await request(app.getHttpServer())
          .get('/projects')
          .query({ generalSearch: 'para' });

        expect(res.status).toBe(200);
        expect(res.body.projects).toEqual([]);
        expect(res.body.projectCount).toBe(0);
        expect(res.body).not.toHaveProperty('suggestedSearchTerms');
      });
    });

    describe('when the term has extra spaces or symbols', () => {
      it.each([
        ' teams',
        'teams ',
        'teams  ',
        'universi  teams',
        'teams&',
        'teams:',
        '(teams)',
        "teams'",
        "o'teams",
      ])(
        'should search its words without failing (%p)',
        async (generalSearch) => {
          const res = await request(app.getHttpServer())
            .get('/projects')
            .query({ generalSearch });

          expect(res.status).toBe(200);
        },
      );

      it('should search nothing when the term has no words', async () => {
        const all = await request(app.getHttpServer()).get('/projects');
        const res = await request(app.getHttpServer())
          .get('/projects')
          .query({ generalSearch: '!!!' });

        expect(res.status).toBe(200);
        expect(res.body.projectCount).toBe(all.body.projectCount);
        expect(res.body.projectCount).toBeGreaterThan(0);
      });

      it('should not run SQL sent in the term', async () => {
        const start = Date.now();
        const res = await request(app.getHttpServer()).get('/projects').query({
          generalSearch: "'),(SELECT/**/1/**/FROM/**/pg_sleep(3))--'",
        });

        expect(res.status).toBe(200);
        expect(Date.now() - start).toBeLessThan(2000);
      });

      it('should find the projects that match its words', async () => {
        const res = await request(app.getHttpServer())
          .get('/projects')
          .query({ generalSearch: ' teams& ' });

        expect(res.status).toBe(200);
        expect(res.body.projects.map((p) => p.name)).toEqual(['Universiteams']);
      });
    });

    describe('when partially match some of their users', () => {
      it('should get the two matching projects', async () => {
        const generalSearchText = 'cam vila';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projectCount).toBe(2);
            expect(res.body.projects).toHaveLength(2);
            // Camila leads one of them and admins the other
            expect(
              res.body.projects.map(
                (p) =>
                  p.enrollments.find((e) => e.user.firstName === 'Camila')
                    ?.role,
              ),
            ).toEqual(expect.arrayContaining(['Leader', 'Admin']));
          });
      });
    });
    describe('when project name is partially matched', () => {
      it('should get all matching projects', async () => {
        const generalSearchText = 'teams';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}&offset=0&limit=5`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(1);
            expect(res.body.projects[0].name).toBe('Universiteams');
          });
      });
    });
    describe('when multiple search terms are provided', () => {
      it.each(['utn frro isi', 'etn frer asi', 'etn frro isa wqwqwqqw'])(
        'should get all matching projects (inputValue %p)',
        async (generalSearchText: string) => {
          await request(app.getHttpServer())
            .get(
              `/projects?generalSearch=${generalSearchText}&offset=0&limit=5`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projectCount).toBe(5);
              expect(res.body.projects).toHaveLength(5);
              if (generalSearchText !== 'utn frro isi') {
                expect(res.body.suggestedSearchTerms[0]).toBe('utn frro isi');
              }
            });
        },
      );
    });
    describe('when multiple search terms that include accents are provided', () => {
      it.each([
        'Estrategias para el diseño óptimo de procesos sustentables considerando la valorización de subproductos y la incorporación de energías renovables',
        'diseño óptimo de procesos sustentables',
        'valorización de subproductos y la incorporación de energías renovables',
      ])(
        'should get the completed project "Estrategias para el diseño óptimo..." (inputValue %p)',
        async (generalSearchText: string) => {
          await request(app.getHttpServer())
            .get(
              `/projects?generalSearch=${generalSearchText}&isDown=true&offset=0&limit=5`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projectCount).toBe(1);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe(
                'Estrategias para el diseño óptimo de procesos sustentables considerando la valorización de subproductos y la incorporación de energías renovables',
              );
            });
        },
      );
    });
    describe('when multiple search terms that include spelling mistakes and accents are provided', () => {
      it.each([
        'valorización de subpoductos pora energias renovables',
        'valoracion de subpoductos para energias renovables',
        'valoracion de subpodutos inergias reniobables',
      ])(
        'should get the completed project "Estrategias para el diseño óptimo..." (inputValue %p)',
        async (generalSearchText: string) => {
          await request(app.getHttpServer())
            .get(
              `/projects?generalSearch=${generalSearchText}&isDown=true&offset=0&limit=5`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projectCount).toBe(1);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe(
                'Estrategias para el diseño óptimo de procesos sustentables considerando la valorización de subproductos y la incorporación de energías renovables',
              );
            });
        },
      );
    });
    describe('and additionally filtered by', () => {
      describe('dateFrom', () => {
        it('should get all projects that partially match their name and were started before dateFrom', async () => {
          const generalSearchText = 'versiteams';
          const dateFrom = '2022-01-01';
          await request(app.getHttpServer())
            .get(
              `/projects?generalSearch=${generalSearchText}&dateFrom=${dateFrom}`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(0);
            });
        });
      });
      describe('isDown', () => {
        describe('true', () => {
          it('should get no projects', async () => {
            const generalSearchText = 'Data Science';
            const isDown = true;
            await request(app.getHttpServer())
              .get(
                `/projects?generalSearch=${generalSearchText}&isDown=${isDown}`,
              )
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(0);
              });
          });
        });
      });
    });
  });
});
