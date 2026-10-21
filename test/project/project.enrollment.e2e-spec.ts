import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { createProjectTestingApp } from './project.e2e.module';
import { Project } from '../../src/project/project.entity';
import { User } from '../../src/user/user.entity';
import {
  Enrollment,
  RequestState,
} from '../../src/enrollment/enrollment.entity';

// Seed data: project 1 is led by user 2 (user2@example.com) and has user 1 as
// a member. User 8 has no enrollment in project 1.
const projectId = 1;
const leader = { email: 'user2@example.com', password: 'Password_2' };
const member = { email: 'user1@example.com', password: 'Password_1' };
const outsiderId = 8;
const outsider = { email: 'user8@example.com', password: 'Password_8' };

describe('Project enrollments (e2e)', () => {
  let app: INestApplication;
  let conn: DataSource;
  let initialProject: Project;
  let initialOutsider: User;

  const login = async (credentials: { email: string; password: string }) => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send(credentials);
    return res.header['set-cookie'][0] as string;
  };

  const getProject = () =>
    conn.getRepository(Project).findOne({
      where: { id: projectId },
      select: ['id', 'userCount', 'requestEnrollmentCount'],
    });

  const getOutsiderEnrollment = () =>
    conn.getRepository(Enrollment).findOne({
      where: { project: { id: projectId }, user: { id: outsiderId } },
      relations: { sender: true },
    });

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    app.use(cookieParser());
    await app.init();

    conn = app.get(DataSource);
    await conn.runMigrations();

    initialProject = await getProject();
    initialOutsider = await conn
      .getRepository(User)
      .findOne({ where: { id: outsiderId } });
  });

  afterEach(async () => {
    await conn
      .getRepository(Enrollment)
      .delete({ project: { id: projectId }, user: { id: outsiderId } });
    await conn.getRepository(Project).update(projectId, {
      userCount: initialProject.userCount,
      requestEnrollmentCount: initialProject.requestEnrollmentCount,
    });
    await conn.getRepository(User).update(outsiderId, {
      requestEnrollmentInvitationsCount:
        initialOutsider.requestEnrollmentInvitationsCount,
    });
    await app.close();
  });

  describe('Enrollment request', () => {
    let outsiderCookie: string;
    beforeEach(async () => {
      outsiderCookie = await login(outsider);
    });

    const requestEnroll = (message = 'Quiero participar') =>
      request(app.getHttpServer())
        .post(`/projects/${projectId}/enroll-request`)
        .set('Cookie', outsiderCookie)
        .send({ message });

    describe('when the user has no enrollment in the project', () => {
      it('should create a pending request and increase the request count', async () => {
        const res = await requestEnroll();
        expect(res.status).toBe(201);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
        expect(enrollment.requesterMessage).toBe('Quiero participar');
        expect(enrollment.sender).toBeNull();

        const project = await getProject();
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount + 1,
        );
      });
    });

    describe('when the user already has a pending request', () => {
      it('should return a server error and keep a single request', async () => {
        await requestEnroll();
        const res = await requestEnroll();

        expect(res.status).toBe(500);
        const project = await getProject();
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount + 1,
        );
      });
    });

    describe('when the user updates the pending request', () => {
      it('should update the requester message', async () => {
        await requestEnroll();
        const res = await request(app.getHttpServer())
          .put(`/projects/${projectId}/enroll-request`)
          .set('Cookie', outsiderCookie)
          .send({ message: 'Mensaje actualizado' });

        expect(res.status).toBe(200);
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requesterMessage).toBe('Mensaje actualizado');
      });
    });

    describe('when the user cancels the pending request', () => {
      it('should delete the request and restore the request count', async () => {
        await requestEnroll();
        const res = await request(app.getHttpServer())
          .delete(`/projects/${projectId}/enroll-request`)
          .set('Cookie', outsiderCookie);

        expect(res.status).toBe(200);
        expect(await getOutsiderEnrollment()).toBeNull();
        const project = await getProject();
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount,
        );
      });
    });

    describe('when an admin lists the requests', () => {
      it('should include the pending request', async () => {
        await requestEnroll();
        const res = await request(app.getHttpServer())
          .get(`/projects/${projectId}/enroll-requests`)
          .set('Cookie', await login(leader));

        expect(res.status).toBe(200);
        expect(
          res.body.enrollmentRequests.map(
            (enrollmentRequest: { user: { id: number } }) =>
              enrollmentRequest.user.id,
          ),
        ).toContain(outsiderId);
      });
    });

    describe('when a non-admin lists the requests', () => {
      it('should return Unauthorized', async () => {
        const res = await request(app.getHttpServer())
          .get(`/projects/${projectId}/enroll-requests`)
          .set('Cookie', await login(member));

        expect(res.status).toBe(401);
      });
    });
  });

  describe('Enrollment request management', () => {
    const manageRequest = async (
      action: 'approve' | 'reject',
      cookie: string,
    ) =>
      request(app.getHttpServer())
        .put(`/projects/${projectId}/enroll-requests/${outsiderId}/${action}`)
        .set('Cookie', cookie)
        .send({ message: 'Respuesta del admin' });

    describe('when there is a pending request', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post(`/projects/${projectId}/enroll-request`)
          .set('Cookie', await login(outsider))
          .send({ message: 'Quiero participar' });
      });

      it('should let an admin approve it', async () => {
        const res = await manageRequest('approve', await login(leader));
        expect(res.status).toBe(200);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Accepted);
        expect(enrollment.adminMessage).toBe('Respuesta del admin');
        const project = await getProject();
        expect(project.userCount).toBe(initialProject.userCount + 1);
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount,
        );
      });

      it('should let an admin reject it', async () => {
        const res = await manageRequest('reject', await login(leader));
        expect(res.status).toBe(200);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Rejected);
        const project = await getProject();
        expect(project.userCount).toBe(initialProject.userCount);
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount,
        );
      });

      it('should not let a non-admin approve it', async () => {
        const res = await manageRequest('approve', await login(member));
        expect(res.status).toBe(401);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
      });
    });

    describe('when there is no request', () => {
      it('should return Bad Request', async () => {
        const res = await manageRequest('approve', await login(leader));
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          `El usuario#${outsiderId} no tiene una solicitud pendiente para el proyecto#${projectId}`,
        );
      });
    });
  });
});
