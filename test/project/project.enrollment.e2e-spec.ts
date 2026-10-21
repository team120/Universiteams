import { INestApplication } from '@nestjs/common';
import * as Bull from 'bull';
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
import { enrollmentInvitationEmailJob } from '../../src/email/email.processor';

// Seed data: project 1 is led by user 2 (user2@example.com) and has user 1 as
// a member. User 8 has no enrollment in project 1.
const projectId = 1;
const leaderId = 2;
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
    jest.restoreAllMocks();
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
      it('should return Bad Request and keep a single request', async () => {
        await requestEnroll();
        const res = await requestEnroll();

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Este usuario ya ha solicitado la inscripción en este proyecto',
        );
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
          'Este usuario no tiene una solicitud pendiente',
        );
      });

      it('should return Unauthorized to a non-admin', async () => {
        const res = await manageRequest('approve', await login(member));
        expect(res.status).toBe(401);
      });
    });

    describe('when the pending enrollment is an invitation', () => {
      beforeEach(async () => {
        await invite(await login(leader));
      });

      it('should not let an admin approve it', async () => {
        const res = await manageRequest('approve', await login(leader));
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Este usuario no tiene una solicitud pendiente',
        );
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
      });

      it('should not list it as a request', async () => {
        const res = await request(app.getHttpServer())
          .get(`/projects/${projectId}/enroll-requests`)
          .set('Cookie', await login(leader));

        expect(res.status).toBe(200);
        expect(
          res.body.enrollmentRequests.map(
            (enrollmentRequest: { user: { id: number } }) =>
              enrollmentRequest.user.id,
          ),
        ).not.toContain(outsiderId);
      });
    });
  });

  const invite = (cookie: string, message = 'Te invito al proyecto') =>
    request(app.getHttpServer())
      .post(`/projects/${projectId}/invitations/${outsiderId}`)
      .set('Cookie', cookie)
      .send({ message });

  const requestEnrollAsOutsider = async () =>
    request(app.getHttpServer())
      .post(`/projects/${projectId}/enroll-request`)
      .set('Cookie', await login(outsider))
      .send({ message: 'Quiero participar' });

  const getOutsiderInvitationsCount = async () =>
    (await conn.getRepository(User).findOne({ where: { id: outsiderId } }))
      .requestEnrollmentInvitationsCount;

  describe('Enrollment invitation', () => {
    let leaderCookie: string;
    beforeEach(async () => {
      leaderCookie = await login(leader);
    });

    describe('when an admin invites a user with no enrollment', () => {
      it('should create a pending invitation sent by the admin', async () => {
        const res = await invite(leaderCookie);
        expect(res.status).toBe(201);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
        expect(enrollment.sender.id).toBe(leaderId);
        expect(enrollment.adminMessage).toBe('Te invito al proyecto');
        expect(enrollment.requesterMessage).toBeNull();

        const project = await getProject();
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount,
        );
      });

      it('should increase the user invitations count from its current value', async () => {
        await conn
          .getRepository(User)
          .update(outsiderId, { requestEnrollmentInvitationsCount: 3 });

        await invite(leaderCookie);

        expect(await getOutsiderInvitationsCount()).toBe(4);
      });

      it('should queue the invitation email to the invited user', async () => {
        // Every registered email queue is a Bull instance
        const addSpy = jest.spyOn(Bull.prototype as Bull.Queue, 'add');

        await invite(leaderCookie);

        expect(addSpy).toHaveBeenCalledTimes(1);
        expect(addSpy).toHaveBeenCalledWith(
          enrollmentInvitationEmailJob,
          expect.objectContaining({
            project: expect.objectContaining({ id: projectId }),
            user: expect.objectContaining({
              id: outsiderId,
              email: outsider.email,
            }),
          }),
        );
      });
    });

    describe('when the invited user views the project', () => {
      it('should show who sent the invitation and its message', async () => {
        await invite(leaderCookie);
        const outsiderCookie = await login(outsider);

        const oneRes = await request(app.getHttpServer())
          .get(`/projects/${projectId}`)
          .set('Cookie', outsiderCookie);
        expect(oneRes.status).toBe(200);
        expect(oneRes.body).toMatchObject({
          requestState: RequestState.Pending,
          adminMessage: 'Te invito al proyecto',
          senderName: 'Camila Villa',
        });

        const listRes = await request(app.getHttpServer())
          .get('/projects')
          .set('Cookie', outsiderCookie);
        expect(listRes.status).toBe(200);
        expect(
          listRes.body.projects.find(
            (project: { id: number }) => project.id === projectId,
          ),
        ).toMatchObject({ senderName: 'Camila Villa' });
      });
    });

    describe('when the user was already invited', () => {
      it('should return Bad Request', async () => {
        await invite(leaderCookie);
        const res = await invite(leaderCookie);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Este usuario ya ha sido invitado para inscribirse en este proyecto',
        );
        expect(await getOutsiderInvitationsCount()).toBe(
          initialOutsider.requestEnrollmentInvitationsCount + 1,
        );
      });

      it('should not let the user request to enroll', async () => {
        await invite(leaderCookie);
        const res = await requestEnrollAsOutsider();

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Este usuario ya ha sido invitado para inscribirse en este proyecto',
        );
      });
    });

    describe('when the user already requested to enroll', () => {
      it('should return Bad Request', async () => {
        await requestEnrollAsOutsider();
        const res = await invite(leaderCookie);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Este usuario ya ha solicitado la inscripción en este proyecto',
        );
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.sender).toBeNull();
      });
    });

    describe('when a non-admin invites', () => {
      it('should return Unauthorized', async () => {
        const res = await invite(await login(member));

        expect(res.status).toBe(401);
        expect(await getOutsiderEnrollment()).toBeNull();
      });
    });

    describe('when the user does not exist', () => {
      it('should return Not Found', async () => {
        const res = await request(app.getHttpServer())
          .post(`/projects/${projectId}/invitations/9999`)
          .set('Cookie', leaderCookie)
          .send({ message: 'Te invito al proyecto' });

        expect(res.status).toBe(404);
      });
    });
  });

  describe('Enrollment invitation management by an admin', () => {
    let leaderCookie: string;
    beforeEach(async () => {
      leaderCookie = await login(leader);
    });

    const updateInvitation = () =>
      request(app.getHttpServer())
        .put(`/projects/${projectId}/invitations/${outsiderId}`)
        .set('Cookie', leaderCookie)
        .send({ message: 'Invitación actualizada' });

    const cancelInvitation = () =>
      request(app.getHttpServer())
        .delete(`/projects/${projectId}/invitations/${outsiderId}`)
        .set('Cookie', leaderCookie);

    describe('when there is a pending invitation', () => {
      beforeEach(async () => {
        await invite(leaderCookie);
      });

      it('should let the admin update its message', async () => {
        const res = await updateInvitation();
        expect(res.status).toBe(200);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.adminMessage).toBe('Invitación actualizada');
      });

      it('should let the admin cancel it and restore the invitations count', async () => {
        const res = await cancelInvitation();
        expect(res.status).toBe(200);

        expect(await getOutsiderEnrollment()).toBeNull();
        expect(await getOutsiderInvitationsCount()).toBe(
          initialOutsider.requestEnrollmentInvitationsCount,
        );
      });

      it('should not let a non-admin cancel it', async () => {
        const res = await request(app.getHttpServer())
          .delete(`/projects/${projectId}/invitations/${outsiderId}`)
          .set('Cookie', await login(member));

        expect(res.status).toBe(401);
        expect(await getOutsiderEnrollment()).not.toBeNull();
      });
    });

    describe('when the invitation was declined', () => {
      it('should let the admin cancel it without changing the invitations count', async () => {
        await invite(leaderCookie);
        await request(app.getHttpServer())
          .put(`/projects/${projectId}/invitation/decline`)
          .set('Cookie', await login(outsider))
          .send({});

        const res = await cancelInvitation();
        expect(res.status).toBe(200);
        expect(await getOutsiderEnrollment()).toBeNull();
        expect(await getOutsiderInvitationsCount()).toBe(
          initialOutsider.requestEnrollmentInvitationsCount,
        );
      });
    });

    describe('when the pending enrollment is a request from the user', () => {
      beforeEach(async () => {
        await requestEnrollAsOutsider();
      });

      it('should not let the admin update it', async () => {
        const res = await updateInvitation();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'Este usuario no tiene una invitación pendiente',
        );

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requesterMessage).toBe('Quiero participar');
        expect(enrollment.adminMessage).toBeNull();
      });

      it('should not let the admin cancel it', async () => {
        const res = await cancelInvitation();
        expect(res.status).toBe(400);

        expect(await getOutsiderEnrollment()).not.toBeNull();
        expect(await getOutsiderInvitationsCount()).toBe(
          initialOutsider.requestEnrollmentInvitationsCount,
        );
        const project = await getProject();
        expect(project.requestEnrollmentCount).toBe(
          initialProject.requestEnrollmentCount + 1,
        );
      });
    });
  });

  describe('Enrollment invitation answer by the invited user', () => {
    let outsiderCookie: string;
    beforeEach(async () => {
      outsiderCookie = await login(outsider);
    });

    const answerInvitation = (action: 'accept' | 'decline') =>
      request(app.getHttpServer())
        .put(`/projects/${projectId}/invitation/${action}`)
        .set('Cookie', outsiderCookie)
        .send({ message: 'Respuesta del usuario' });

    describe('when there is a pending invitation', () => {
      beforeEach(async () => {
        await invite(await login(leader));
      });

      it('should let the user accept it', async () => {
        const res = await answerInvitation('accept');
        expect(res.status).toBe(200);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Accepted);
        expect(enrollment.requesterMessage).toBe('Respuesta del usuario');
        expect(enrollment.adminMessage).toBe('Te invito al proyecto');
        const project = await getProject();
        expect(project.userCount).toBe(initialProject.userCount + 1);
        expect(await getOutsiderInvitationsCount()).toBe(
          initialOutsider.requestEnrollmentInvitationsCount,
        );
      });

      it('should let the user decline it', async () => {
        const res = await answerInvitation('decline');
        expect(res.status).toBe(200);

        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Declined);
        const project = await getProject();
        expect(project.userCount).toBe(initialProject.userCount);
        expect(await getOutsiderInvitationsCount()).toBe(
          initialOutsider.requestEnrollmentInvitationsCount,
        );
      });
    });

    describe('when the pending enrollment is a request from the user', () => {
      it('should not let the user accept it', async () => {
        await requestEnrollAsOutsider();
        const res = await answerInvitation('accept');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'No tienes una invitación pendiente para este proyecto',
        );
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
      });
    });

    describe('when the user declined an invitation and later requested to enroll', () => {
      beforeEach(async () => {
        await invite(await login(leader));
        await answerInvitation('decline');
        await requestEnrollAsOutsider();
      });

      it('should store the request without the old sender', async () => {
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
        expect(enrollment.sender).toBeNull();
        expect(enrollment.adminMessage).toBeNull();
      });

      it('should not let the user accept their own request', async () => {
        const res = await answerInvitation('accept');

        expect(res.status).toBe(400);
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Pending);
        const project = await getProject();
        expect(project.userCount).toBe(initialProject.userCount);
      });

      it('should let an admin approve the request', async () => {
        const res = await request(app.getHttpServer())
          .put(`/projects/${projectId}/enroll-requests/${outsiderId}/approve`)
          .set('Cookie', await login(leader))
          .send({});

        expect(res.status).toBe(200);
        const enrollment = await getOutsiderEnrollment();
        expect(enrollment.requestState).toBe(RequestState.Accepted);
      });
    });
  });
});
