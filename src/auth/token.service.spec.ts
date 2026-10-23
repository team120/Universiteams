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
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { CurrentUserDto } from './dtos/current-user.dto';
import { Response } from 'express';

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
          expect(err.message).toBe('Token de acceso inválido');
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
        const result = service.checkRefreshToken(token, user.refreshUserSecret);
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
        const result = service.checkRefreshToken(token, user.refreshUserSecret);
        expect(result.isValid).toBe(false);
        expect(result.errorMessage).toBe('El refresh token no es válido');
      });
    });
  });
});

describe('Token service cookies', () => {
  const createService = (env: Record<string, string>) =>
    new TokenService(
      {} as EntityMapperService,
      { get: (key: string) => env[key] } as unknown as ConfigService,
      {
        getTokenExpirationInDurationFormat: () => ({ minutes: 15 }),
      } as unknown as TokenExpirationTimes,
      { setContext: jest.fn() } as unknown as PinoLogger,
    );
  const currentUser = {
    accessToken: 'Bearer access',
    refreshToken: 'Bearer refresh',
  } as CurrentUserDto;

  describe('appendTokenCookies', () => {
    describe('when SECURE_COOKIE is "false" and SAME_SITE_POLICY is "lax"', () => {
      it('should set both cookies without Secure and with SameSite=lax', () => {
        const service = createService({
          [SecretsVaultKeys.SAME_SITE_POLICY]: 'lax',
          [SecretsVaultKeys.SECURE_COOKIE]: 'false',
        });
        const response = { cookie: jest.fn() } as unknown as Response;

        service.appendTokenCookies(response, currentUser);

        expect(response.cookie).toHaveBeenCalledTimes(2);
        for (const [, , options] of (response.cookie as jest.Mock).mock.calls) {
          expect(options.secure).toBe(false);
          expect(options.sameSite).toBe('lax');
          expect(options.httpOnly).toBe(true);
        }
      });
    });
    describe('when SECURE_COOKIE is "true" and SAME_SITE_POLICY is "none"', () => {
      it('should set both cookies with Secure and SameSite=none', () => {
        const service = createService({
          [SecretsVaultKeys.SAME_SITE_POLICY]: 'none',
          [SecretsVaultKeys.SECURE_COOKIE]: 'true',
        });
        const response = { cookie: jest.fn() } as unknown as Response;

        service.appendTokenCookies(response, currentUser);

        expect(response.cookie).toHaveBeenCalledTimes(2);
        for (const [, , options] of (response.cookie as jest.Mock).mock.calls) {
          expect(options.secure).toBe(true);
          expect(options.sameSite).toBe('none');
        }
      });
    });
  });

  describe('constructor', () => {
    describe('when the cookie settings are invalid', () => {
      it('should throw, so the app fails at startup', () => {
        expect(() =>
          createService({
            [SecretsVaultKeys.SAME_SITE_POLICY]: 'none',
            [SecretsVaultKeys.SECURE_COOKIE]: 'false',
          }),
        ).toThrow('SAME_SITE_POLICY=none requires SECURE_COOKIE=true');
      });
    });
  });
});
