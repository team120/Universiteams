import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection } from 'typeorm';
import { createProjectTestingApp } from './project.e2e.module';

describe('Project Actions (e2e)', () => {
  let app: INestApplication;
  let conn: Connection;

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('search projects by a general text search', () => {
    describe('when partially match some of their users', () => {
      it('should get the two matching projects', async () => {
        const generalSearchText = 'cam vila';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projectCount).toBe(2);
            expect(res.body.projects).toHaveLength(2);
            expect(
              res.body.projects[1].enrollments.filter(
                (e) => e.role === 'Admin',
              )[0].user.firstName,
            ).toEqual('Camila');
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
        'Estrategias para el dise??o ??ptimo de procesos sustentables considerando la valorizaci??n de subproductos y la incorporaci??n de energ??as renovables',
        'dise??o ??ptimo de procesos sustentables',
        'valorizaci??n de subproductos y la incorporaci??n de energ??as renovables',
      ])(
        'should get the completed project "Estrategias para el dise??o ??ptimo..." (inputValue %p)',
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
                'Estrategias para el dise??o ??ptimo de procesos sustentables considerando la valorizaci??n de subproductos y la incorporaci??n de energ??as renovables',
              );
            });
        },
      );
    });
    describe('when multiple search terms that include spelling mistakes and accents are provided', () => {
      it.each([
        'valorizaci??n de subpoductos pora energias renovables',
        'valoracion de subpoductos para energias renovables',
        'valoracion de subpodutos inergias reniobables',
      ])(
        'should get the completed project "Estrategias para el dise??o ??ptimo..." (inputValue %p)',
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
                'Estrategias para el dise??o ??ptimo de procesos sustentables considerando la valorizaci??n de subproductos y la incorporaci??n de energ??as renovables',
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
