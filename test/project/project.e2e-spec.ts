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
          expect(res.body.projects).toHaveLength(2);
        });
    });
  });

  describe('search projects by a known property', () => {
    describe('when isDown parameter is provided', () => {
      describe('and set to false', () => {
        it('should get every project', async () => {
          const isDown = false;
          await request(app.getHttpServer())
            .get(`/projects/?isDown=${isDown}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(2);
            });
        });
      });

      describe('and set to true', () => {
        it('should get no projects', async () => {
          const isDown = true;
          await request(app.getHttpServer())
            .get(`/projects/?isDown=${isDown}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(0);
            });
        });
        it('should get no projects as well when another parameter is provided', async () => {
          const isDown = true;
          const type = 'Informal';
          await request(app.getHttpServer())
            .get(`/projects/?isDown=${isDown}&type=${type}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(0);
            });
        });
      });
    });
    describe('dateFrom is sent', () => {
      describe('less than a year', () => {
        it('should get the UPM project only', async () => {
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
    describe('when project type is', () => {
      describe('Informal', () => {
        const projectName = 'Universiteams';
        it(`should get one project which name is ${projectName}`, async () => {
          const type = 'Informal';
          await request(app.getHttpServer())
            .get(`/projects?type=${type}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe(projectName);
            });
        });
      });
      describe('Formal', () => {
        const projectName =
          'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)';
        it(`should get one project which name is ${projectName}`, async () => {
          const type = 'Formal';
          await request(app.getHttpServer())
            .get(`/projects?type=${type}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
              expect(res.body.projects[0].name).toBe(projectName);
            });
        });
      });
    });
  });

  describe('sorting', () => {
    describe('by project name', () => {
      it('should get all projects sorted by name in ascending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=name&inAscendingOrder=true')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(2);
            expect(res.body.projects[0].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
            expect(res.body.projects[1].name).toBe('Universiteams');
          });
      });

      it('should get all projects sorted by name in descending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=name&order=descending')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(2);
            expect(res.body.projects[0].name).toBe('Universiteams');
            expect(res.body.projects[1].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
          });
      });
    });
    describe('by project type', () => {
      it('should get all projects in descending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=type&order=descending')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(2);
            expect(res.body.projects[0].name).toBe('Universiteams');
            expect(res.body.projects[1].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
          });
      });
      it('should get all projects in descending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=type&order=descending')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects).toHaveLength(2);
            expect(res.body.projects[0].name).toBe('Universiteams');
            expect(res.body.projects[1].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
          });
      });
    });
    describe('by project creation date', () => {
      it('should get all projects sorted by date in ascending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=creationDate&inAscendingOrder=true')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects[0].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
            expect(res.body.projects[1].name).toBe('Universiteams');
          });
      });
      it('should get all projects sorted by date in ascending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=creationDate&inAscendingOrder=true')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body.projects[0].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
            expect(res.body.projects[1].name).toBe('Universiteams');
          });
      });
    });
  });

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
  describe('search projects by a general text search', () => {
    describe('when exactly match some of their users', () => {
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
    describe('and additionally filtered by', () => {
      describe('userId', () => {
        it('should get all projects that partially match their name and exactly one of their users', async () => {
          const generalSearchText = 'VERS';
          const userId = 3;
          await request(app.getHttpServer())
            .get(
              `/projects?generalSearch=${generalSearchText}&userId=${userId}`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body.projects).toHaveLength(1);
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
    });
  });
});
