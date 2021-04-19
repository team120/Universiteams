import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
import { projects } from './project.snapshot.e2e';
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
          expect(res.body.message).toEqual(`Not Found`);
        });
    });
    test.each([1, 2])(
      'should get the specified project (id: %s) with their associated users',
      async (id) => {
        await request(app.getHttpServer())
          .get(`/projects/${id}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toEqual(projects.filter((e) => e.id === id).pop());
            expect(res.body.users[0].password).not.toBeDefined();
          });
      },
    );
  });

  describe('Get all', () => {
    it('should get all projects and their associated users', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body).toEqual(projects);
          expect(res.body[0].users[0].password).not.toBeDefined();
          expect(res.body).toHaveLength(2);
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
              expect(res.body).toHaveLength(2);
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
              expect(res.body).toHaveLength(0);
            });
        });
        it('should get no projects as well when another parameter is provided', async () => {
          const isDown = true;
          const type = 'Informal';
          await request(app.getHttpServer())
            .get(`/projects/?isDown=${isDown}&type=${type}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body).toHaveLength(0);
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
              expect(res.body).toHaveLength(1);
              expect(res.body[0].name).toBe('University Projects Manager');
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
              expect(res.body).toHaveLength(0);
            });
        });
      });
    });
    describe('when project type is', () => {
      describe('Informal', () => {
        const projectName = 'University Projects Manager';
        it(`should get one project which name is ${projectName}`, async () => {
          const type = 'Informal';
          await request(app.getHttpServer())
            .get(`/projects?type=${type}`)
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body).toHaveLength(1);
              expect(res.body[0].name).toBe(projectName);
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
              expect(res.body).toHaveLength(1);
              expect(res.body[0].name).toBe(projectName);
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
            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
            expect(res.body[1].name).toBe('University Projects Manager');
          });
      });

      it('should get all projects sorted by name in descending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=name&order=descending')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe('University Projects Manager');
            expect(res.body[1].name).toBe(
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
            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe('University Projects Manager');
            expect(res.body[1].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
          });
      });
      it('should get all projects in descending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=type&order=descending')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].name).toBe('University Projects Manager');
            expect(res.body[1].name).toBe(
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
            expect(res.body[0].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
            expect(res.body[1].name).toBe('University Projects Manager');
          });
      });
      it('should get all projects sorted by date in ascending order', async () => {
        await request(app.getHttpServer())
          .get('/projects?sortBy=creationDate&inAscendingOrder=true')
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body[0].name).toBe(
              'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
            );
            expect(res.body[1].name).toBe('University Projects Manager');
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
        expect(res.body).toHaveLength(1);
        expect(res.body).toEqual(
          projects.filter(
            (e) => e.users.filter((u) => u.id === userId).length > 0,
          ),
        );
      });
  });
  describe('search projects by a general text search', () => {
    describe('when exactly match some of their users', () => {
      it('should get the two existent projects', async () => {
        const generalSearchText = 'fAk';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
          });
      });
    });
    describe('when project name is partially matched', () => {
      it('should get all matching projects', async () => {
        const generalSearchText = 'Manager';
        await request(app.getHttpServer())
          .get(`/projects?generalSearch=${generalSearchText}`)
          .then((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toEqual(
              projects.filter((p) => p.name.includes(generalSearchText)),
            );
            expect(res.body).toHaveLength(1);
          });
      });
    });
    describe('and additionally filtered by', () => {
      describe('userId', () => {
        it('should get all projects that partially match their name and exactly one of their users', async () => {
          const generalSearchText = 'VERS';
          const userId = 2;
          await request(app.getHttpServer())
            .get(
              `/projects?generalSearch=${generalSearchText}&userId=${userId}`,
            )
            .then((res) => {
              expect(res.status).toBe(200);
              expect(res.body).toEqual(
                projects.filter((p) =>
                  p.name.toUpperCase().includes(generalSearchText),
                ),
              );
              expect(res.body).toHaveLength(1);
            });
        });
      });
      describe('type', () => {
        describe('Formal', () => {
          it('should get no projects', async () => {
            const generalSearchText = 'VERS';
            const type = 'Formal';
            await request(app.getHttpServer())
              .get(`/projects?generalSearch=${generalSearchText}&type=${type}`)
              .then((res) => {
                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(0);
              });
          });
        });
      });
    });
  });
});
