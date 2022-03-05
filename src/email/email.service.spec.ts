import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../user/user.entity';
import { EmailService, EMAIL_SENDERS } from './email.service';
import { VerificationEmailTokenService } from './verification-email-token.service';

describe('Email service', () => {
  let service: EmailService;
  const emailSendersMock = [];
  const verificationEmailTokenServiceMock = {
    generateVerificationUrl: jest.fn(),
  };
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        EmailService,
        { provide: EMAIL_SENDERS, useValue: emailSendersMock },
        {
          provide: VerificationEmailTokenService,
          useValue: verificationEmailTokenServiceMock,
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
    for (let i = 0; i <= emailSendersMock.length; i++) {
      emailSendersMock.pop();
    }
  });

  describe('when emailSenders array is empty', () => {
    it("shouldn't throw any exceptions and just return", async () => {
      const user = {
        id: 1,
        firstName: 'Juan',
        lastName: 'Acha',
        email: 'user1@example.com',
      };

      let exceptionThrown = false;
      try {
        await service.sendVerificationEmail(user as User);
      } catch {
        exceptionThrown = true;
      }
      expect(exceptionThrown).toBe(false);
    });
  });
  describe('when emailSenders array is only composed of one email sender', () => {
    describe('and that one works correctly', () => {
      it('should resolve the promise', async () => {
        const senderMock = { sendMail: jest.fn().mockResolvedValue({}) };
        emailSendersMock.push(senderMock);
        const user = {
          id: 1,
          firstName: 'Juan',
          lastName: 'Acha',
          email: 'user1@example.com',
        };

        await service.sendVerificationEmail(user as User);

        expect(senderMock.sendMail).toBeCalledTimes(1);
      });
    });
    describe('and that one fails', () => {
      it("shouldn't throw any exceptions and just return", async () => {
        const senderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        emailSendersMock.push(senderMock);
        const user = {
          id: 1,
          firstName: 'Juan',
          lastName: 'Acha',
          email: 'user1@example.com',
        };

        let exceptionThrown = false;
        try {
          await service.sendVerificationEmail(user as User);
        } catch {
          exceptionThrown = true;
        }
        expect(exceptionThrown).toBe(false);
        expect(senderMock.sendMail).toBeCalledTimes(1);
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
        const user = {
          id: 1,
          firstName: 'Juan',
          lastName: 'Acha',
          email: 'user1@example.com',
        };

        await service.sendVerificationEmail(user as User);

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(1);
      });
    });
    describe('and all of them fail', () => {
      it("shouldn't throw any exceptions and just return", async () => {
        const firstSenderMock = { sendMail: jest.fn().mockRejectedValue({}) };
        const secondSenderMock = {
          sendMail: jest.fn().mockRejectedValue({}),
        };
        emailSendersMock.push(firstSenderMock);
        emailSendersMock.push(secondSenderMock);
        const fallbackEmailSend = jest.spyOn(service, 'fallbackEmailSend');
        const user = {
          id: 1,
          firstName: 'Juan',
          lastName: 'Acha',
          email: 'user1@example.com',
        };

        await service.sendVerificationEmail(user as User);

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(2);
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
        const user = {
          id: 1,
          firstName: 'Juan',
          lastName: 'Acha',
          email: 'user1@example.com',
        };

        await service.sendVerificationEmail(user as User);

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(thirdSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(2);
      });
    });
    describe('and all of them fail', () => {
      it("shouldn't throw any exceptions and just return", async () => {
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
        const user = {
          id: 1,
          firstName: 'Juan',
          lastName: 'Acha',
          email: 'user1@example.com',
        };

        await service.sendVerificationEmail(user as User);

        expect(firstSenderMock.sendMail).toBeCalledTimes(1);
        expect(secondSenderMock.sendMail).toBeCalledTimes(1);
        expect(thirdSenderMock.sendMail).toBeCalledTimes(1);
        expect(fallbackEmailSend).toBeCalledTimes(3);
      });
    });
  });
});
