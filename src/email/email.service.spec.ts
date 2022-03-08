import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../user/user.entity';
import { EmailException } from '../utils/exceptions/exceptions';
import { EmailService, EMAIL_SENDERS } from './email.service';
import { VerificationMessagesService } from './verification-messages.service';

describe('Email service', () => {
  let service: EmailService;
  const emailSendersMock = [{ sendMail: jest.fn() }];
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

        await service.sendVerificationEmail(user as User);

        expect(emailSendersMock[0].sendMail).toBeCalledTimes(1);
      });
    });
    describe('and that one fails', () => {
      it('should throw an EmailException', async () => {
        emailSendersMock[0].sendMail.mockRejectedValue({});

        await service.sendVerificationEmail(user as User).catch((err) => {
          expect(err).toBeInstanceOf(EmailException);
          expect(err.response).toBe('Internal Server Error');
        });

        expect(emailSendersMock[0].sendMail).toBeCalledTimes(1);
        expect.assertions(3);
      });
    });
  });
});
