import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { AuthService } from './auth.service';
import { User, UserSystemRole } from '../user/user.entity';
import { TokenService } from './token.service';
import { VerificationMessagesService } from '../email/verification-messages.service';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { emailQueueProcessor } from '../email/email.processor';
import { Unauthorized } from '../utils/exceptions/exceptions';

describe('Auth service', () => {
  let service: AuthService;
  const userRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const verificationMessagesService = {
    checkVerificationEmailToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleFixture = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: TokenService, useValue: {} },
        { provide: getQueueToken(emailQueueProcessor), useValue: {} },
        { provide: ConfigService, useValue: {} },
        {
          provide: VerificationMessagesService,
          useValue: verificationMessagesService,
        },
        {
          provide: PinoLogger,
          useValue: { setContext: jest.fn(), debug: jest.fn() },
        },
        { provide: EntityMapperService, useValue: {} },
      ],
    }).compile();

    service = moduleFixture.get(AuthService);
  });

  describe('verifyEmail', () => {
    describe('when the current user no longer exists', () => {
      it('should throw Unauthorized without checking the token or saving', async () => {
        userRepo.findOne.mockResolvedValue(null);

        await expect(
          service.verifyEmail(
            { verificationToken: 'token' },
            {
              id: 1,
              user: 'Juan Rizzo',
              email: 'user1@example.com',
              isEmailVerified: false,
              systemRole: UserSystemRole.USER,
            },
          ),
        ).rejects.toBeInstanceOf(Unauthorized);
        expect(
          verificationMessagesService.checkVerificationEmailToken,
        ).not.toHaveBeenCalled();
        expect(userRepo.save).not.toHaveBeenCalled();
      });
    });
  });
});
