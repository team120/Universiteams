import { INestApplication } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { UserE2EModule } from './user.e2e.module';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import {
  Enrollment,
  RequestState,
} from '../../src/enrollment/enrollment.entity';
import { Project } from '../../src/project/project.entity';

// User 8 has no enrollment in project 1 in the seed data
const userId = 8;
const projectId = 1;

describe('User Actions (e2e)', () => {
  let app: INestApplication;
  let conn: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserE2EModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conn = app.get(DataSource);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await conn.getRepository(Project).restore(projectId);
    await conn
      .getRepository(Enrollment)
      .delete({ project: { id: projectId }, user: { id: userId } });
    await app.close();
  });

  describe('get users', () => {
    it('should return all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body.users).toHaveLength(20);
          expect(res.body.usersCount).toEqual(20);
          expect(res.body.users[0]).not.toHaveProperty('password');
        });
    });
  });
  describe('get one user', () => {
    it.each(
      Object.values(RequestState).filter(
        (requestState) => requestState !== RequestState.Accepted,
      ),
    )(
      'should not list a %s enrollment among the user projects',
      async (requestState: RequestState) => {
        await conn.getRepository(Enrollment).insert({
          project: { id: projectId },
          user: { id: userId },
          requestState,
        });

        const res = await request(app.getHttpServer()).get(`/users/${userId}`);

        expect(res.status).toBe(200);
        expect(
          res.body.enrollments.map(
            (enrollment: { project: { id: number } }) => enrollment.project.id,
          ),
        ).not.toContain(projectId);
      },
    );

    it('should list an accepted enrollment among the user projects', async () => {
      await conn.getRepository(Enrollment).insert({
        project: { id: projectId },
        user: { id: userId },
        requestState: RequestState.Accepted,
      });

      const res = await request(app.getHttpServer()).get(`/users/${userId}`);

      expect(res.status).toBe(200);
      expect(
        res.body.enrollments.map(
          (enrollment: { project: { id: number } }) => enrollment.project.id,
        ),
      ).toContain(projectId);
    });

    it('should not list a deleted project among the user projects', async () => {
      await conn.getRepository(Enrollment).insert({
        project: { id: projectId },
        user: { id: userId },
        requestState: RequestState.Accepted,
      });
      await conn.getRepository(Project).softDelete(projectId);

      const res = await request(app.getHttpServer()).get(`/users/${userId}`);

      expect(res.status).toBe(200);
      // The user may be a member of other projects
      for (const enrollment of res.body.enrollments) {
        expect(enrollment.project).toEqual(expect.any(Object));
      }
    });
  });

  describe('get users with pagination', () => {
    it('should return only five users when using limit', async () => {
      await request(app.getHttpServer())
        .get('/users?limit=5')
        .then((res) => {
          expect(res.status).toBe(200);
          expect(res.body.users).toHaveLength(5);
          expect(res.body.usersCount).toEqual(20);
          expect(res.body.users[0]).not.toHaveProperty('password');
        });
    });
  });
  describe('promote user to admin', () => {
    it('should return 401 unauthorized if current user is not SUPER_ADMIN', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user3@example.com', password: 'Password_3' });
      const accessTokenCookie = res.header['set-cookie'][0];
      await request(app.getHttpServer())
        .post('/users/1/promote')
        .set('Cookie', accessTokenCookie)
        .then((res) => {
          expect(res.status).toBe(401);
          expect(res.body.message).toEqual('No autorizado');
        });
    });
  });
});
