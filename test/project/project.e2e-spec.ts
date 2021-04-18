import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ProjectE2EModule } from './project.e2e.module';

describe('Get one project (e2e)', () => {
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

  it('should return the project with the specified id', async () => {
    const id = 2;
    await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(id);
        expect(res.body.name).toEqual('University Projects Manager');
      });
  });
  it('should return ID not found if it does not match any id on DB', async () => {
    const id = 100;
    await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .then((res) => {
        expect(res.status).toBe(404);
        expect(res.body.message).toEqual(`Not Found`);
      });
  });
  it('should get the specified project with their associated users', async () => {
    const id = 1;
    await request(app.getHttpServer())
      .get(`/projects/${id}`)
      .then((res) => {
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
          id: 1,
          name:
            'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
          type: 'Formal',
          isDown: false,
          creationDate: '2020-03-16T17:13:02.000Z',
          department: {
            id: 1,
            name: 'Ingeniería en Sistemas',
            university: {
              id: 1,
              name: 'UTN',
            },
          },
          users: [
            {
              mail: 'user1@example.com',
              lastName: 'Doe',
              name: 'John',
              university: {
                id: 1,
                name: 'UTN',
              },
            },
            {
              mail: 'user2@example.com',
              name: 'Afak',
              lastName: 'Ename',
              university: {
                id: 1,
                name: 'UTN',
              },
            },
          ],
        });
        expect(res.body.users[0].password).not.toBeDefined();
      });
  });
});
