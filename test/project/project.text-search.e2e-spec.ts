import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
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
              )[0].user.name,
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
        'should get all matching projects',
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
