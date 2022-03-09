import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { TokenService } from './token.service';
import * as jwt from 'jsonwebtoken';
import { SecretsVaultKeys } from '../utils/secrets';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { User } from '../user/user.entity';
import { TokenExpirationTimes } from '../utils/token-expiration/token-expiration-times';
import { PinoLogger } from 'nestjs-pino';

describe('Token service', () => {
  let service: TokenService;
  let config: ConfigService;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [SerializationModule, ConfigModule],
      providers: [
        TokenService,
        {
          provide: TokenExpirationTimes,
          useValue: jest.fn(),
        },
        {
          provide: PinoLogger,
          useValue: {
            error: jest.fn(),
            setContext: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleFixture.get(TokenService);
    config = moduleFixture.get(ConfigService);
  });

  describe('checkAccessToken', () => {
    describe('when access token is valid', () => {
      it('should return the decoded token and isValid: true', () => {
        const token = jwt.sign(
          { id: 1 },
          config.get(SecretsVaultKeys.ACCESS_TOKEN),
          {
            expiresIn: '10m',
          },
        );
        const result = service.checkAccessToken(token);
        expect(result.isValid).toBe(true);
        expect(result.decodedToken.id).toBe(1);
      });
    });
    describe('when access token is expired', () => {
      it('should return the decoded token and isValid: false', () => {
        const token = jwt.sign(
          { id: 1 },
          config.get(SecretsVaultKeys.ACCESS_TOKEN),
          {
            expiresIn: '0s',
          },
        );
        const result = service.checkAccessToken(token);
        expect(result.isValid).toBe(false);
        expect(result.decodedToken.id).toBe(1);
      });
    });
    describe('when access token is expired', () => {
      it('should throw an exception (unauthorized)', () => {
        const token = jwt
          .sign({ id: 1 }, config.get(SecretsVaultKeys.ACCESS_TOKEN), {
            expiresIn: '0s',
          })
          .concat('saasqwqeqewq');
        try {
          service.checkAccessToken(token);
        } catch (err) {
          expect(err).toBeInstanceOf(Unauthorized);
          expect(err.message).toBe('Access token incorrectly formatted');
        }
        expect.assertions(2);
      });
    });
  });
  describe('checkRefreshToken', () => {
    describe('when refresh token is valid', () => {
      it('should return isValid: true', async () => {
        const user: Partial<User> = {
          id: 1,
          refreshUserSecret: 'hjqehJeqeoQKLJWnsnal',
        };
        const token = jwt.sign(
          { id: user.id },
          config.get(SecretsVaultKeys.REFRESH_TOKEN) + user.refreshUserSecret,
          {
            expiresIn: '10m',
          },
        );
        const result = service.checkRefreshToken(token, user as User);
        expect(result.isValid).toBe(true);
        expect(result.errorMessage).not.toBeDefined();
      });
    });
    describe('when refresh token is expired', () => {
      it('should return isValid: false and an error message', () => {
        const user: Partial<User> = {
          id: 1,
          refreshUserSecret: 'hjqehJeqeoQKLJWnsnal',
        };
        const token = jwt.sign(
          { id: user.id },
          config.get(SecretsVaultKeys.REFRESH_TOKEN) + user.refreshUserSecret,
          {
            expiresIn: '0s',
          },
        );
        const result = service.checkRefreshToken(token, user as User);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('Refresh token is invalid');
      });
    });
    describe('when refresh token holds a different id than accessTokenUser', () => {
      it('should return isValid: false and an error message', () => {
        const user: Partial<User> = {
          id: 1,
          refreshUserSecret: 'hjqehJeqeoQKLJWnsnal',
        };
        const token = jwt.sign(
          { id: 24 },
          config.get(SecretsVaultKeys.REFRESH_TOKEN) + user.refreshUserSecret,
          {
            expiresIn: '10m',
          },
        );
        const result = service.checkRefreshToken(token, user as User);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe(
          "Refresh token userId doesn't match access token respective one",
        );
      });
    });
  });
});
