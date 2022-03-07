import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../user/user.entity';
import { EmailException } from '../utils/exceptions/exceptions';
import { EmailService, EMAIL_SENDERS } from './email.service';
import { VerificationMessagesService } from './verification-messages.service';

describe('Email service', () => {
  let service: EmailService;
  const emailSendersMock = [];
  const verificationMessagesServiceMock = {
    generateVerifyEmailUrl: jest.fn(),
    generateForgetPasswordUrl: jest.fn(),
  } as Partial<
    { [key in keyof VerificationMessagesService]: jest.Mock<any, any> }
  >;
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        EmailService,
        { provide: EMAIL_SENDERS, useValue: emailSendersMock },
        {
          provide: VerificationMessagesService,
          useValue: verificationMessagesServiceMock,
        },
        {
          provide: PinoLogger,
          useValue: { info: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = moduleFixture.get(EmailService);
  });

  afterEach(() => {
    emailSendersMock.splice(0, emailSendersMock.length);
  });

  const user = {
    id: 1,
    firstName: 'Juan',
    lastName: 'Acha',
    email: 'user1@example.com',
  };

  describe('when emailSenders array is empty', () => {
    it('should throw an EmailException', async () => {
      await service.sendVerificationEmail(user as User).catch((err) => {
        expect(err).toBeInstanceOf(EmailException);
        expect(err.response).toBe('Internal Server Error');
      });
      expect.assertions(2);
    });
  });
  describe('when emailSenders array is only composed of one email sender', () => {
    describe('and that one works correctly', () => {
      it('should resolve the promise', async () => {
        const senderMock = { sendMail: jest.fn().mockResolvedValue({}) };
        emailSendersMock.push(senderMock);

        await service.sendVerificationEmail(user as User);

        expect(senderMock.sendMail).toBeCalledTimes(1);
      });
    });
    describe('and that one fails', () => {
      it('should throw an EmailException', async () => {
        const senderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        emailSendersMock.push(senderMock);

        await service.sendVerificationEmail(user as User).catch((err) => {
          expect(err).toBeInstanceOf(EmailException);
          expect(err.response).toBe('Internal Server Error');
        });

        expect(senderMock.sendMail).toBeCalledTimes(1);
        expect.assertions(3);
      });
    });
  });
  describe('when emailSenders array is composed of two email senders', () => {
    describe('and the first one fails and the second one works correctly', () => {
      it('should resolve the promise', async () => {
        const firstSenderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        const secondSenderMock = {
          sendMail: jest.fn().mockResolvedValue({}),
        };
        emailSendersMock.push(firstSenderMock);
        emailSendersMock.push(secondSenderMock);
        const fallbackEmailSend = jest.spyOn(service, 'fallbackEmailSend');

        await service.sendVerificationEmail(user as User);

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(1);
      });
    });
    describe('and all of them fail', () => {
      it('should throw an EmailException', async () => {
        const firstSenderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        const secondSenderMock = {
          sendMail: jest.fn().mockRejectedValue({}),
        };
        emailSendersMock.push(firstSenderMock);
        emailSendersMock.push(secondSenderMock);
        const fallbackEmailSend = jest.spyOn(service, 'fallbackEmailSend');

        await service.sendVerificationEmail(user as User).catch((err) => {
          expect(err).toBeInstanceOf(EmailException);
          expect(err.response).toBe('Internal Server Error');
        });

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(2);
        expect.assertions(5);
      });
    });
  });
  describe('when emailSenders array is composed of three email senders', () => {
    describe('and the first and second one fail and the third one works correctly', () => {
      it('should resolve the promise', async () => {
        const firstSenderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        const secondSenderMock = {
          sendMail: jest.fn().mockRejectedValue({}),
        };
        const thirdSenderMock = {
          sendMail: jest.fn().mockResolvedValue({}),
        };
        emailSendersMock.push(firstSenderMock);
        emailSendersMock.push(secondSenderMock);
        emailSendersMock.push(thirdSenderMock);
        const fallbackEmailSend = jest.spyOn(service, 'fallbackEmailSend');

        await service.sendVerificationEmail(user as User);

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(thirdSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(2);
      });
    });
    describe('and all of them fail', () => {
      it('should throw an EmailException', async () => {
        const firstSenderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        const secondSenderMock = {
          sendMail: jest.fn().mockRejectedValue({}),
        };
        const thirdSenderMock = {
          sendMail: jest.fn().mockRejectedValue({}),
        };
        emailSendersMock.push(firstSenderMock);
        emailSendersMock.push(secondSenderMock);
        emailSendersMock.push(thirdSenderMock);
        const fallbackEmailSend = jest.spyOn(service, 'fallbackEmailSend');

        await service.sendVerificationEmail(user as User).catch((err) => {
          expect(err).toBeInstanceOf(EmailException);
          expect(err.response).toBe('Internal Server Error');
        });

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(thirdSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(3);
        expect.assertions(6);
      });
    });
  });
});
