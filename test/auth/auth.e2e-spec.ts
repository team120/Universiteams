import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, DeepPartial } from 'typeorm';
import { User } from '../../src/user/user.entity';
import { RegisterDto } from '../../src/auth/dtos/register.dto';
import * as setCookieParser from 'set-cookie-parser';
import { EmailMessage, EMAIL_SENDERS } from '../../src/email/email.processor';
import { createAuthTestModule } from './auth.e2e-module';
import { VerificationMessagesService } from '../../src/email/verification-messages.service';
import * as cookieParser from 'cookie-parser';
import { TokenExpirationTimes } from '../../src/utils/token-expiration/token-expiration-times';
import { TokenExpirationTimesFake } from '../utils/token-expiration-times.fake';
import { SendGridEmailSender } from '../../src/email/sendgrid.email-sender';
import { SendInBlueEmailSender } from '../../src/email/sendinblue.email-sender';
import { NodemailerEmailSender } from '../../src/email/nodemailer.email-sender';
import { LoginDto } from '../../src/auth/dtos/login.dto';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';

describe('auth', () => {
  let app: INestApplication;
  let conn: DataSource;
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

    conn = app.get(DataSource);
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
          .send({ email: 'user1@example.com', password: 'Password_1' });

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
          .send({ email: 'user1', password: 'Password_1' })
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
          .send({ email: 'user10045654@example.com', password: 'Password_1' })
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
      const registrationAttempt = validRegistrationToBeSaved();
      describe('and email verification is correctly handled by first email sender', () => {
        beforeEach(() => {
          emailSendersMock[0].sendMail.mockReturnValue({});
        });
        it('should save a new user and return an auth token', async () => {
          const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt);

          const emailQueue = app.get<Queue>(getQueueToken('emails'));

          await emailQueue.whenCurrentJobsFinished();
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

          expect(res.status).toBe(201);
          expect(res.body.email).toBe(registrationAttempt.email);
          expect(res.body.id).toBeDefined();
          expect(res.body.firstName).toBe(registrationAttempt.firstName);
          expect(res.body.lastName).toBe(registrationAttempt.lastName);
          expect(res.body.password).not.toBeDefined();

          const accessTokenCookie = setCookieParser.parse(
            res.header['set-cookie'][0],
          )[0];

          expect(accessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
          expect(accessTokenCookie.httpOnly).toBe(true);
          expect(accessTokenCookie.sameSite).toBe('Strict');

          const insertedUser = await conn
            .getRepository(User)
            .findOne({where: { email: registrationAttempt.email }});
          expect(insertedUser).toBeDefined();
          expect(insertedUser.email).toBe(registrationAttempt.email);
          expect(insertedUser.firstName).toBe(registrationAttempt.firstName);
        });
      });
      describe('and email verification is incorrectly handled by first email sender', () => {
        beforeEach(() => {
          emailSendersMock[0].sendMail.mockRejectedValue({});
        });
        it('should save a new user and return an auth token, while relying on second email sender for email verification', async () => {
          const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send(registrationAttempt);

          const emailQueue = app.get<Queue>(getQueueToken('emails'));

          await emailQueue.whenCurrentJobsFinished();
          expect(emailSendersMock[0].sendMail).toHaveBeenCalledTimes(1);
          expect(emailSendersMock[1].sendMail).toHaveBeenCalledTimes(0);

          expect(res.status).toBe(201);
          expect(res.body.email).toBe(registrationAttempt.email);
          expect(res.body.id).toBeDefined();
          expect(res.body.firstName).toBe(registrationAttempt.firstName);
          expect(res.body.lastName).toBe(registrationAttempt.lastName);
          expect(res.body.password).not.toBeDefined();

          const accessTokenCookie = setCookieParser.parse(
            res.header['set-cookie'][0],
          )[0];

          expect(accessTokenCookie.value).toMatch(/Bearer\s\w+/gm);
          expect(accessTokenCookie.httpOnly).toBe(true);
          expect(accessTokenCookie.sameSite).toBe('Strict');

          const insertedUser = await conn
            .getRepository(User)
            .findOne({where: { email: registrationAttempt.email }});
          expect(insertedUser).toBeDefined();
          expect(insertedUser.email).toBe(registrationAttempt.email);
          expect(insertedUser.firstName).toBe(registrationAttempt.firstName);
        });
      });

      afterEach(async () => {
        await conn
          .getRepository(User)
          .delete({ email: registrationAttempt.email });
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
              .findOne({where: { email: registrationAttempt.email }});
            expect(insertedUser).toBeNull();
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
                .findOne({where: { email: registrationAttempt.email }});
              expect(insertedUser).toBeNull();
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
                .findOne({where: { email: registrationAttempt.email }});
              expect(insertedUser).toBeNull();
            });
        });
      });
      describe('symbols and email is invalid', () => {
        it('should return a validation error result (bad request)', async () => {
          const registrationAttempt = validRegistrationNotToBeSaved({
            email: 'notAnEmail@.com',
            password: 'Password87',
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
                .findOne({where: { email: registrationAttempt.email }});
              expect(insertedUser).toBeNull();
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
              .count({where: { email: registrationAttempt.email }});
            expect(usersInDbWithThatEmail).toBe(1);
          });
      });
    });
  });

  describe('verify email', () => {
    let accessTokenCookie: string;
    let refreshTokenCookie: string;
    let notVerifiedUser: User;
    beforeEach(async () => {
      const email = 'user16@example.com';
      const userWithoutEmailVerified = await conn
        .getRepository(User)
        .findOne({where: { email: email, isEmailVerified: false }});
      if (!userWithoutEmailVerified)
        throw new Error('User has already verified its email');
      notVerifiedUser = userWithoutEmailVerified;

      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: email,
        password: 'Password_16',
      });

      accessTokenCookie = res.header['set-cookie'][0];
      refreshTokenCookie = res.header['set-cookie'][1];
    });
    describe('when a valid email verification token is provided', () => {
      it('should set isEmailVerified to true', async () => {
        const verificationEmailTokenService = app.get(
          VerificationMessagesService,
        );
        const verificationTokenInUrl = await verificationEmailTokenService
          .generateVerifyEmailUrl(notVerifiedUser)
          .then((url) => url.split('token=')[1]);

        const res = await request(app.getHttpServer())
          .post('/auth/verify-email')
          .set('Cookie', `${accessTokenCookie}; ${refreshTokenCookie}`)
          .send({ verificationToken: verificationTokenInUrl });

        expect(res.status).toBe(200);

        const user = await conn.getRepository(User).findOne({where: {id: notVerifiedUser.id}});
        expect(user.isEmailVerified).toBe(true);
      });
      afterEach(async () => {
        await conn
          .getRepository(User)
          .update(notVerifiedUser.id, { isEmailVerified: false });
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
          const verificationTokenInUrl = await verificationEmailTokenService
            .generateVerifyEmailUrl(notVerifiedUser)
            .then((url) => url.split('token=')[1]);

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
        const user = await conn.getRepository(User).findOne({where: {id: notVerifiedUser.id}});
        expect(user.isEmailVerified).toBe(false);
      });
    });
  });

  describe('forgot password', () => {
    describe('when email address is valid and has been verified', () => {
      beforeEach(() => {
        emailSendersMock[0].sendMail.mockResolvedValue({});
      });
      it('should return OK and send a forgot password email', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({
            email: 'user1@example.com',
          });

        const emailQueue = app.get<Queue>(getQueueToken('emails'));

        await emailQueue.whenCurrentJobsFinished();
        expect(emailSendersMock[0].sendMail).toBeCalledTimes(1);
        expect(emailSendersMock[1].sendMail).toBeCalledTimes(0);

        expect(res.status).toBe(200);
      });
    });
    describe('when email address is invalid', () => {
      it.each(['user16example.com', '@example.com'])(
        'should return BadRequest',
        async (email: string) => {
          const res = await request(app.getHttpServer())
            .post('/auth/forgot-password')
            .send({
              email: email,
            });

          expect(res.status).toBe(400);
          expect(res.body.message).toEqual(['email must be an email']);
        },
      );
    });
    describe('when email address is either not a verified email or is not associated with a personal user account', () => {
      it.each(['user16@example.com', 'user70@example.com'])(
        'should return BadRequest',
        async (email: string) => {
          const res = await request(app.getHttpServer())
            .post('/auth/forgot-password')
            .send({
              email: email,
            });

          expect(res.status).toBe(400);
          expect(res.body.message).toBe(
            'That address is either not a verified email or is not associated with a personal user account',
          );
        },
      );
    });
  });

  describe('reset password', () => {
    const verifiedUserEmail = 'user1@example.com';
    const oldPassword = 'Password_1';
    describe('when email address is valid and has been verified', () => {
      let verifiedUser: User;
      let expiredAccessTokenBeforeReset: string;
      let validRefreshTokenBeforeReset: string;
      beforeEach(async () => {
        verifiedUser = await conn
          .getRepository(User)
          .findOne({where: { email: verifiedUserEmail }});

        tokenExpirationTimesTesting.set({
          accessToken: { value: 0, dimension: 'seconds' },
        });

        const loginBeforeReset = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: verifiedUserEmail,
            password: oldPassword,
          } as LoginDto);
        expect(loginBeforeReset.status).toBe(200);

        expiredAccessTokenBeforeReset =
          loginBeforeReset.header['set-cookie'][0];
        validRefreshTokenBeforeReset = loginBeforeReset.header['set-cookie'][1];

        tokenExpirationTimesTesting.restore();
      });
      describe('and is equal to the email address stored in verification token', () => {
        it('should return OK and update password', async () => {
          const verificationEmailTokenService = app.get(
            VerificationMessagesService,
          );
          const verificationTokenInUrl = await verificationEmailTokenService
            .generateForgetPasswordUrl(verifiedUser)
            .then((url) => url.split('token=')[1]);

          const newPassword = 'Password_14';
          const res = await request(app.getHttpServer())
            .post('/auth/reset-password')
            .send({
              email: verifiedUserEmail,
              password: newPassword,
              verificationToken: verificationTokenInUrl,
            });

          expect(res.status).toBe(200);

          const verifiedUserWithNewPassword = await conn
            .getRepository(User)
            .findOne({where: { email: verifiedUserEmail }});

          expect(verifiedUserWithNewPassword.password).not.toBe(
            verifiedUser.password,
          );
          expect(verifiedUserWithNewPassword.refreshUserSecret).not.toBe(
            verifiedUser.refreshUserSecret,
          );

          const loginWithOldPassword = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: verifiedUserEmail,
              password: oldPassword,
            } as LoginDto);
          expect(loginWithOldPassword.status).toBe(401);

          const emailVerificationTokenInUrl =
            await verificationEmailTokenService
              .generateVerifyEmailUrl(verifiedUser)
              .then((url) => url.split('token=')[1]);

          const attemptRestrictedAction = await request(app.getHttpServer())
            .post('/auth/verify-email')
            .send({ verificationToken: emailVerificationTokenInUrl })
            .set(
              'Cookie',
              `${expiredAccessTokenBeforeReset}; ${validRefreshTokenBeforeReset}`,
            );
          expect(attemptRestrictedAction.status).toBe(401);

          const loginWithNewPassword = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: verifiedUserEmail,
              password: newPassword,
            } as LoginDto);
          expect(loginWithNewPassword.status).toBe(200);
        });
        afterEach(async () => {
          await conn
            .getRepository(User)
            .update(verifiedUser.id, { password: verifiedUser.password });
        });
      });

      describe('and is not equal to the email address stored in verification token', () => {
        it('should return Unauthorized', async () => {
          const verificationEmailTokenService = app.get(
            VerificationMessagesService,
          );
          const verificationTokenInUrl = await verificationEmailTokenService
            .generateForgetPasswordUrl({
              ...verifiedUser,
              email: 'other@example.com',
            })
            .then((url) => url.split('token=')[1]);

          const res = await request(app.getHttpServer())
            .post('/auth/reset-password')
            .send({
              email: verifiedUserEmail,
              password: 'Password_14',
              verificationToken: verificationTokenInUrl,
            });

          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Unauthorized');
        });
      });

      describe('but verification token is expired', () => {
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
          const verificationTokenInUrl = await verificationEmailTokenService
            .generateForgetPasswordUrl({
              ...verifiedUser,
              email: 'other@example.com',
            })
            .then((url) => url.split('token=')[1]);

          const res = await request(app.getHttpServer())
            .post('/auth/reset-password')
            .send({
              email: verifiedUserEmail,
              password: 'Password_14',
              verificationToken: verificationTokenInUrl,
            });

          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Unauthorized');
        });
        afterEach(() => {
          tokenExpirationTimesTesting.restore();
        });
      });
    });

    describe('when email address and password are invalid', () => {
      it.each(['user16example.com', '@example.com'])(
        'should return BadRequest',
        async (email: string) => {
          const res = await request(app.getHttpServer())
            .post('/auth/reset-password')
            .send({
              email: email,
              password: 'Password87',
              verificationToken: 'asasoheqjleqlhkjqelkhjHOJkljh',
            });

          expect(res.status).toBe(400);
          expect(res.body.message).toContain('email must be an email');
          expect(res.body.message).toContain(
            'password must include at least: one non-alphanumeric character (#,$,%,etc)',
          );
          expect(res.body.message).toContain(
            'verificationToken must be a jwt string',
          );
        },
      );
    });
  });
  describe('when email address is either not a verified email or is not associated with a personal user account', () => {
    it.each(['user16@example.com', 'user70@example.com'])(
      'should return BadRequest',
      async (email: string) => {
        const res = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            email: email,
            password: 'Password_14',
            verificationToken:
              'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NDY2MjcxNjYsImV4cCI6MTY0NjYyNzE2OCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.Fg5lSJFvnV3CYf9Hsi4o6m56HbqgXvAsgwpxxKGXfgM',
          });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe(
          'That address is either not a verified email or is not associated with a personal user account',
        );
      },
    );
  });
});
