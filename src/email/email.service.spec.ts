import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { User } from '../user/user.entity';
import { EmailProcessor, EMAIL_SENDERS } from './email.processor';
import { VerificationMessagesService } from './verification-messages.service';

describe('Email service', () => {
  let service: EmailProcessor;
  const emailSendersMock = [
    { sendMail: jest.fn() },
    { sendMail: jest.fn() },
    { sendMail: jest.fn() },
  ];
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
        EmailProcessor,
        { provide: EMAIL_SENDERS, useValue: emailSendersMock },
        {
          provide: VerificationMessagesService,
          useValue: verificationMessagesServiceMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = moduleFixture.get(EmailProcessor);
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
});
