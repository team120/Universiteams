import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection, DeepPartial } from 'typeorm';
import { User } from '../../src/user/user.entity';
import { RegisterDto } from '../../src/auth/dtos/register.dto';
import * as setCookieParser from 'set-cookie-parser';
import { EmailMessage, EMAIL_SENDERS } from '../../src/email/email.service';
import { createAuthTestModule } from './auth.e2e-module';
import { CurrentUserDto } from '../../src/auth/dtos/current-user.dto';
import { VerificationMessagesService } from '../../src/email/verification-messages.service';
import * as cookieParser from 'cookie-parser';
import { TokenExpirationTimes } from '../../src/utils/token-expiration/token-expiration-times';
import { TokenExpirationTimesFake } from '../utils/token-expiration-times.fake';
import { SendGridEmailSender } from '../../src/email/sendgrid.email-sender';
import { SendInBlueEmailSender } from '../../src/email/sendinblue.email-sender';
import { NodemailerEmailSender } from '../../src/email/nodemailer.email-sender';

describe('auth', () => {
  let app: INestApplication;
  let conn: Connection;
  const emailSendersMock = [
    {
      sendMail: jest.fn(),
    },
    {
      sendMail: jest.fn(),
    },
    {
      sendMail: jest.fn(),
    },
  ];
  const tokenExpirationTimesTesting = new TokenExpirationTimesFake({
    accessToken: {
      value: 15,
      dimension: 'minutes',
    },
    refreshToken: { value: 7, dimension: 'days' },
    emailVerificationToken: {
      value: 30,
      dimension: 'minutes',
    },
  });

  beforeEach(async () => {
    const module = await createAuthTestModule()
      .overrideProvider(SendGridEmailSender)
      .useValue({})
      .overrideProvider(SendInBlueEmailSender)
      .useValue({})
      .overrideProvider(NodemailerEmailSender)
      .useValue({})
      .overrideProvider(EMAIL_SENDERS)
      .useValue(emailSendersMock)
      .overrideProvider(TokenExpirationTimes)
      .useValue(tokenExpirationTimesTesting)
      .compile();

    app = module.createNestApplication();

    app.use(cookieParser());
    await app.init();

    conn = app.get(Connection);
    await conn.runMigrations();
  });
  afterEach(async () => {
    for (const emailSenderMock of emailSendersMock) {
      emailSenderMock.sendMail.mockReset();
    }
    await app.close();
  });

  describe('login', () => {
    describe('when supplied credentials are valid', () => {
      it('should return an auth token', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user1@example.com', password: 'password1' });

        expect(res.status).toBe(200);
        expect(res.body.email).toBe('user1@example.com');
        expect(res.body.id).toBe(1);
        expect(res.body.firstName).toBe('Juan');
        expect(res.body.lastName).toBe('Rizzo');
        expect(res.body.password).not.toBeDefined();

        const accessTokenCookie = setCookieParser.parse(
          res.header['set-cookie'][0],
        )[0];

        expect(accessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
        expect(accessTokenCookie.httpOnly).toBe(true);
        expect(accessTokenCookie.sameSite).toBe('Strict');
      });
    });
    describe('when supplied email is not valid', () => {
      it('should return a validation error', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user1', password: 'password1' })
          .then((res) => {
            expect(res.status).toBe(400);
            expect(res.body.message[0]).toBe('email must be an email');
            expect(res.body.accessToken).not.toBeDefined();
          });
      });
    });
    describe('when no user has that email', () => {
      it('should return unauthorized without revealing more details', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user10045654@example.com', password: 'password1' })
          .then((res) => {
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
            expect(res.body.accessToken).not.toBeDefined();
          });
      });
    });
    describe('when there is a matching user but the supplied password is incorrect', () => {
      it('should return unauthorized without revealing more details', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'user1@example.com', password: 'password2' })
          .then((res) => {
            expect(res.status).toBe(401);
            expect(res.body.message).toBe('Unauthorized');
            expect(res.body.accessToken).not.toBeDefined();
          });
      });
    });
  });

  describe('register', () => {
    const validRegistrationToBeSaved = (
      modifiedUserProps?: DeepPartial<RegisterDto>,
    ) => ({
      email: 'user100@example.com',
      firstName: 'Carlos',
      lastName: 'Kazan',
      password: 'Password#54',
      ...modifiedUserProps,
    });
    const validRegistrationNotToBeSaved = (
      modifiedUserProps?: DeepPartial<RegisterDto>,
    ) => ({
      email: 'user70@example.com',
      firstName: 'Pedro',
      lastName: 'Koch',
      password: 'Password#54',
      ...modifiedUserProps,
    });
    describe('when supplied credentials are valid', () => {
      let insertedUserId: number;
      describe('and email verification is correctly handled by first email sender', () => {
        beforeEach(() => {
          emailSendersMock[0].sendMail.mockReturnValue({});
        });
        it('should save a new user and return an auth token', async () => {
          const registrationAttempt = validRegistrationToBeSaved();
          const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt);
          insertedUserId = res.body.user.id;

          expect(emailSendersMock[0].sendMail).toHaveBeenCalledTimes(1);
          expect(emailSendersMock[0].sendMail).toHaveBeenCalledWith(
            expect.objectContaining({
              to: {
                email: registrationAttempt.email,
                name: `${registrationAttempt.firstName} ${registrationAttempt.lastName}`,
              },
              subject: 'Please confirm your email',
              text: expect.not.stringContaining('link="undefined"'),
              html: expect.not.stringContaining('href="undefined"'),
            } as Partial<EmailMessage>),
          );
          expect(emailSendersMock[1].sendMail).toHaveBeenCalledTimes(0);
          expect(emailSendersMock[2].sendMail).toHaveBeenCalledTimes(0);

          expect(res.status).toBe(201);
          expect(res.body.user.email).toBe(registrationAttempt.email);
          expect(res.body.user.id).toBeDefined();
          expect(res.body.user.firstName).toBe(registrationAttempt.firstName);
          expect(res.body.user.lastName).toBe(registrationAttempt.lastName);
          expect(res.body.user.password).not.toBeDefined();

          const accessTokenCookie = setCookieParser.parse(
            res.header['set-cookie'][0],
          )[0];

          expect(accessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
          expect(accessTokenCookie.httpOnly).toBe(true);
          expect(accessTokenCookie.sameSite).toBe('Strict');

          const insertedUser = await conn
            .getRepository(User)
            .findOne(insertedUserId);
          expect(insertedUser).toBeDefined();
          expect(insertedUser.email).toBe(registrationAttempt.email);
          expect(insertedUser.firstName).toBe(registrationAttempt.firstName);
        });
      });
      describe('and email verification is incorrectly handled by first email sender, while relying on second email sender for email verification', () => {
        beforeEach(() => {
          emailSendersMock[0].sendMail.mockRejectedValue({});
          emailSendersMock[1].sendMail.mockResolvedValue({});
        });
        it('should save a new user and return an auth token', async () => {
          const registrationAttempt = validRegistrationToBeSaved();
          const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt);
          insertedUserId = res.body.user.id;

          expect(emailSendersMock[0].sendMail).toHaveBeenCalledTimes(1);
          expect(emailSendersMock[1].sendMail).toHaveBeenCalledTimes(1);
          expect(emailSendersMock[2].sendMail).toHaveBeenCalledTimes(0);

          expect(res.status).toBe(201);
          expect(res.body.user.email).toBe(registrationAttempt.email);
          expect(res.body.user.id).toBeDefined();
          expect(res.body.user.firstName).toBe(registrationAttempt.firstName);
          expect(res.body.user.lastName).toBe(registrationAttempt.lastName);
          expect(res.body.user.password).not.toBeDefined();

          const accessTokenCookie = setCookieParser.parse(
            res.header['set-cookie'][0],
          )[0];

          expect(accessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
          expect(accessTokenCookie.httpOnly).toBe(true);
          expect(accessTokenCookie.sameSite).toBe('Strict');

          const insertedUser = await conn
            .getRepository(User)
            .findOne(insertedUserId);
          expect(insertedUser).toBeDefined();
          expect(insertedUser.email).toBe(registrationAttempt.email);
          expect(insertedUser.firstName).toBe(registrationAttempt.firstName);
        });
      });
      describe('and email verification is incorrectly handled by all email senders', () => {
        beforeEach(() => {
          emailSendersMock[0].sendMail.mockRejectedValue({});
          emailSendersMock[1].sendMail.mockResolvedValue({});
        });
        it('should save a new user and return an auth token', async () => {
          const registrationAttempt = validRegistrationToBeSaved();
          const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt);
          insertedUserId = res.body.user.id;

          expect(emailSendersMock[0].sendMail).toHaveBeenCalledTimes(1);
          expect(emailSendersMock[1].sendMail).toHaveBeenCalledTimes(1);
          expect(emailSendersMock[2].sendMail).toHaveBeenCalledTimes(0);

          expect(res.status).toBe(201);
          expect(res.body.user.email).toBe(registrationAttempt.email);
          expect(res.body.user.id).toBeDefined();
          expect(res.body.user.firstName).toBe(registrationAttempt.firstName);
          expect(res.body.user.lastName).toBe(registrationAttempt.lastName);
          expect(res.body.user.password).not.toBeDefined();

          const accessTokenCookie = setCookieParser.parse(
            res.header['set-cookie'][0],
          )[0];

          expect(accessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
          expect(accessTokenCookie.httpOnly).toBe(true);
          expect(accessTokenCookie.sameSite).toBe('Strict');

          const insertedUser = await conn
            .getRepository(User)
            .findOne(insertedUserId);
          expect(insertedUser).toBeDefined();
          expect(insertedUser.email).toBe(registrationAttempt.email);
          expect(insertedUser.firstName).toBe(registrationAttempt.firstName);
        });
      });

      afterEach(async () => {
        await conn.getRepository(User).delete(insertedUserId);
      });
    });
    describe('when supplied email, firstName and lastName are not valid', () => {
      it('should return a validation error result (bad request)', async () => {
        const registrationAttempt = validRegistrationNotToBeSaved({
          email: 'userexample.com',
          firstName: 'C',
          lastName: 'K',
        });
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registrationAttempt)
          .then(async (res) => {
            expect(res.status).toBe(400);
            expect(res.body.message).toContain('email must be an email');
            expect(res.body.message).toContain(
              'firstName must be longer than or equal to 2 characters',
            );
            expect(res.body.message).toContain(
              'lastName must be longer than or equal to 2 characters',
            );
            expect(res.body.accessToken).not.toBeDefined();

            const insertedUser = await conn
              .getRepository(User)
              .findOne({ email: registrationAttempt.email });
            expect(insertedUser).not.toBeDefined();
          });
      });
    });

    describe('when supplied password lacks ', () => {
      describe('uppercase characters, numbers and symbols and is less than 8 character long', () => {
        it('should return a validation error result (bad request)', async () => {
          const registrationAttempt = validRegistrationNotToBeSaved({
            password: 'pass',
          });
          await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt)
            .then(async (res) => {
              expect(res.status).toBe(400);
              expect(res.body.message).toContain(
                'password must be longer than or equal to 8 characters',
              );
              expect(res.body.message).toContain(
                'password must include at least: one uppercase alphabetic character, one number, one non-alphanumeric character (#,$,%,etc)',
              );
              expect(res.body.accessToken).not.toBeDefined();

              const insertedUser = await conn
                .getRepository(User)
                .findOne({ email: registrationAttempt.email });
              expect(insertedUser).not.toBeDefined();
            });
        });
      });

      describe('numbers and symbols', () => {
        it('should return a validation error result (bad request)', async () => {
          const registrationAttempt = validRegistrationNotToBeSaved({
            password: 'Password',
          });
          await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt)
            .then(async (res) => {
              expect(res.status).toBe(400);
              expect(res.body.message[0]).toBe(
                'password must include at least: one number, one non-alphanumeric character (#,$,%,etc)',
              );
              expect(res.body.accessToken).not.toBeDefined();

              const insertedUser = await conn
                .getRepository(User)
                .findOne({ email: registrationAttempt.email });
              expect(insertedUser).not.toBeDefined();
            });
        });
      });
      describe('symbols and email is invalid', () => {
        it('should return a validation error result (bad request)', async () => {
          const registrationAttempt = validRegistrationNotToBeSaved({
            email: 'notAnEmail@.com',
            password: 'Password12',
          });
          await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt)
            .then(async (res) => {
              expect(res.status).toBe(400);
              expect(res.body.message).toContain(
                'password must include at least: one non-alphanumeric character (#,$,%,etc)',
              );
              expect(res.body.message).toContain('email must be an email');
              expect(res.body.accessToken).not.toBeDefined();

              const insertedUser = await conn
                .getRepository(User)
                .findOne({ email: registrationAttempt.email });
              expect(insertedUser).not.toBeDefined();
            });
        });
      });
    });

    describe('when that email is already taken', () => {
      it('should return bad request', async () => {
        const registrationAttempt = validRegistrationToBeSaved({
          email: 'user1@example.com',
        });
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(registrationAttempt)
          .then(async (res) => {
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('user1@example.com is already taken');
            expect(res.body.accessToken).not.toBeDefined();

            const usersInDbWithThatEmail = await conn
              .getRepository(User)
              .count({ email: registrationAttempt.email });
            expect(usersInDbWithThatEmail).toBe(1);
          });
      });
    });
  });

  describe('verify email', () => {
    let loginResult: CurrentUserDto;
    let accessTokenCookie: string;
    let refreshTokenCookie: string;
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user1@example.com', password: 'password1' });

      loginResult = res.body;
      accessTokenCookie = res.header['set-cookie'][0];
      refreshTokenCookie = res.header['set-cookie'][1];
    });
    describe('when a valid email verification token is provided', () => {
      it('should set isEmailVerified to true', async () => {
        const verificationEmailTokenService = app.get(
          VerificationMessagesService,
        );
        const verificationTokenInUrl = verificationEmailTokenService
          .generateVerifyEmailUrl(loginResult as any)
          .split('token=')[1];

        const res = await request(app.getHttpServer())
          .post('/auth/verify-email')
          .set('Cookie', `${accessTokenCookie}; ${refreshTokenCookie}`)
          .send({ verificationToken: verificationTokenInUrl });

        expect(res.status).toBe(200);

        const user = await conn.getRepository(User).findOne(loginResult.id);
        expect(user.isEmailVerified).toBe(true);
      });
      afterEach(async () => {
        await conn
          .getRepository(User)
          .update(loginResult.id, { isEmailVerified: false });
      });
    });
    describe('when an invalid email verification token is provided', () => {
      describe("since it isn't a jwt string", () => {
        it('should return BadRequest (verificationToken must be a jwt string)', async () => {
          const res = await request(app.getHttpServer())
            .post('/auth/verify-email')
            .set('Cookie', `${accessTokenCookie}; ${refreshTokenCookie}`)
            .send({
              verificationToken:
                'hkjhqehiewhqnkj//kdasssssssowqheiuoqwh.qewehqio',
            });

          expect(res.status).toBe(400);
          expect(res.body.message[0]).toBe(
            'verificationToken must be a jwt string',
          );
        });
      });
      describe("since the user didn't visit this endpoint on time, so the verification token in url expired", () => {
        beforeEach(() => {
          tokenExpirationTimesTesting.set({
            emailVerificationToken: {
              value: 0,
              dimension: 'seconds',
            },
          });
        });
        it('should return Unauthorized', async () => {
          const verificationEmailTokenService = app.get(
            VerificationMessagesService,
          );
          const verificationTokenInUrl = verificationEmailTokenService
            .generateVerifyEmailUrl(loginResult as any)
            .split('token=')[1];

          const res = await request(app.getHttpServer())
            .post('/auth/verify-email')
            .set('Cookie', `${accessTokenCookie}; ${refreshTokenCookie}`)
            .send({
              verificationToken: verificationTokenInUrl,
            });

          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Unauthorized');
        });
        afterEach(() => {
          tokenExpirationTimesTesting.restore();
        });
      });
      afterEach(async () => {
        const user = await conn.getRepository(User).findOne(loginResult.id);
        expect(user.isMailVerified).toBe(false);
      });
    });
  });
});
