import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../user/user.entity';
import { EmailProcessor, EMAIL_SENDERS } from './email.processor';
import { VerificationMessagesService } from './verification-messages.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Enrollment } from '../enrollment/enrollment.entity';
import {
  EnrollmentInvitationNotifyEmailData,
  EnrollmentRequestNotifyEmailData,
} from './dtos/enrollment-request-email-data.dto';

describe('Email processor', () => {
  let service: EmailProcessor;
  const emailSendersMock = [
    { sendMail: jest.fn() },
    { sendMail: jest.fn() },
    { sendMail: jest.fn() },
  ];
  const enrollmentRepositoryMock = { find: jest.fn() };
  const verificationMessagesServiceMock = {
    generateVerifyEmailUrl: jest.fn(),
    generateForgetPasswordUrl: jest.fn(),
  } as Partial<{
    [key in keyof VerificationMessagesService]: jest.Mock<any, any>;
  }>;
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        EmailProcessor,
        { provide: EMAIL_SENDERS, useValue: emailSendersMock },
        {
          provide: VerificationMessagesService,
          useValue: verificationMessagesServiceMock,
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepositoryMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = moduleFixture.get(EmailProcessor);
  });

  describe('and that one fails', () => {
    it('should throw an EmailException', async () => {
      emailSendersMock[0].sendMail.mockRejectedValue(new Error('Queue error'));

      await service
        .sendVerificationEmail({ data: { ...user } } as Job<User>)
        .catch((err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message).toBe('Queue error');
        });

      expect(emailSendersMock[0].sendMail).toBeCalledTimes(1);
      expect(emailSendersMock[1].sendMail).toBeCalledTimes(0);
      expect(emailSendersMock[2].sendMail).toBeCalledTimes(0);
      expect.assertions(5);
    });
  });

  afterEach(() => {
    emailSendersMock.forEach((emailSenderMock) => {
      emailSenderMock.sendMail.mockReset();
    });
  });

  const user = {
    id: 1,
    firstName: 'Juan',
    lastName: 'Acha',
    email: 'user1@example.com',
  };

  describe('when emailSenders array is only composed of one email sender', () => {
    describe('and that one works correctly', () => {
      it('should resolve the promise', async () => {
        emailSendersMock[0].sendMail.mockResolvedValue({});

        await service.sendVerificationEmail({ data: { ...user } } as Job<User>);

        expect(emailSendersMock[0].sendMail).toBeCalledTimes(1);
        expect(emailSendersMock[1].sendMail).toBeCalledTimes(0);
        expect(emailSendersMock[2].sendMail).toBeCalledTimes(0);
      });
    });
  });

  describe('sendEnrollmentInvitationNotifyEmail', () => {
    it('should send one email to the invited user naming the project', async () => {
      emailSendersMock[0].sendMail.mockResolvedValue({});

      await service.sendEnrollmentInvitationNotifyEmail({
        data: { project: { id: 1, name: 'Universiteams' }, user: { ...user } },
      } as Job<EnrollmentInvitationNotifyEmailData>);

      expect(emailSendersMock[0].sendMail).toBeCalledTimes(1);
      const message = emailSendersMock[0].sendMail.mock.calls[0][0];
      expect(message.to).toEqual([
        { email: 'user1@example.com', name: 'Juan Acha' },
      ]);
      expect(message.subject).toContain('Universiteams');
    });
  });

  // Names come from user input, so they must not become HTML in the email
  describe('when names contain HTML', () => {
    const htmlName = '<a href="https://evil.example">Verifica tu cuenta</a>';
    const escapedName =
      '&lt;a href=&quot;https://evil.example&quot;&gt;Verifica tu cuenta&lt;/a&gt;';

    it('should escape the project name in the invitation email', async () => {
      emailSendersMock[0].sendMail.mockResolvedValue({});

      await service.sendEnrollmentInvitationNotifyEmail({
        data: { project: { id: 1, name: htmlName }, user: { ...user } },
      } as Job<EnrollmentInvitationNotifyEmailData>);

      const message = emailSendersMock[0].sendMail.mock.calls[0][0];
      expect(message.html).toContain(escapedName);
      expect(message.html).not.toContain('<a href');
    });

    it('should escape the requester name in the request email', async () => {
      emailSendersMock[0].sendMail.mockResolvedValue({});
      enrollmentRepositoryMock.find.mockResolvedValue([{ user: { ...user } }]);

      await service.sendEnrollmentRequestNotifyEmail({
        data: {
          project: { id: 1, name: 'Universiteams' },
          user: { id: 8, user: htmlName },
        },
      } as Job<EnrollmentRequestNotifyEmailData>);

      const message = emailSendersMock[0].sendMail.mock.calls[0][0];
      expect(message.html).toContain(escapedName);
      expect(message.html).not.toContain('<a href');
    });
  });
});
