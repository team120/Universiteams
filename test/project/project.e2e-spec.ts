import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';
import { projects } from './project.snapshot.e2e';
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
