import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
import { projects } from './project.snapshot';
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

  describe('search projects by a general text search', () => {
    describe('when partially match some of their users', () => {
      it('should get the two existent projects', async () => {
        const generalSearchText = 'carl';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(2);
          });
      });
    });
    describe('when project name is partially matched', () => {
      it('should get all matching projects', async () => {
        const generalSearchText = 'teams';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toEqual(
              projects.filter((p) => p.name.includes(generalSearchText)),
            );
            expect(res.body.projects).toHaveLength(1);
          });
      });
    });
    describe('when multiple search terms are provided', () => {
      it.each(['utn frro isi', 'uen frer asi', 'atn frro wqwqwqqw'])(
        'should get all matching projects',
        async (generalSearchText: string) => {
          await request(app.getHttpServer())
            .get(`/projects?generalSearch=${generalSearchText}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(2);
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
      describe('type', () => {
        describe('Formal', () => {
          it('should get no projects', async () => {
            const generalSearchText = 'Data Science';
            const type = 'Formal';
            await request(app.getHttpServer())
              .get(`/projects?generalSearch=${generalSearchText}&type=${type}`)
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body.projects).toHaveLength(0);
              });
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
