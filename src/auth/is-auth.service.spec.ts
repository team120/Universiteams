import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { RequestWithUser } from '../utils/request-with-user';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { GeneralTokenDecoded } from './dtos/token';
import { IsAuthService } from './is-auth.service';
import { TokenService } from './token.service';

describe('IsAuthService', () => {
  const claims = { id: 1, iat: 100, exp: 1000 } as GeneralTokenDecoded;
  const newClaims = { id: 1, iat: 2000, exp: 2900 } as GeneralTokenDecoded;
  const user = { id: 1, refreshUserSecret: 'secret' } as User;

  let findOne: jest.Mock;
  let tokenService: jest.Mocked<
    Pick<
      TokenService,
      | 'checkAccessToken'
      | 'decodeToken'
      | 'checkRefreshToken'
      | 'generateTokens'
      | 'appendTokenCookies'
    >
  >;
  let service: IsAuthService;
  const response = {} as Response;
  const requestWith = (cookies?: Record<string, string>) =>
    ({ cookies } as RequestWithUser);

  beforeEach(() => {
    tokenService = {
      checkAccessToken: jest.fn(),
      decodeToken: jest.fn(),
      checkRefreshToken: jest.fn(),
      generateTokens: jest.fn(),
      appendTokenCookies: jest.fn(),
    };
    service = new IsAuthService(
      {
        findOne: (findOne = jest.fn().mockResolvedValue(user)),
      } as unknown as Repository<User>,
      tokenService as unknown as TokenService,
      {
        mapValue: (_: unknown, value: unknown) => value,
      } as unknown as EntityMapperService,
      {
        setContext: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
      } as unknown as PinoLogger,
    );
  });

  describe('getCurrentUserClaims', () => {
    describe('when the access token is valid', () => {
      it('should return its claims without renewing the tokens', async () => {
        tokenService.checkAccessToken.mockReturnValue({
          isValid: true,
          decodedToken: claims,
        });

        const result = await service.getCurrentUserClaims(
          requestWith({ accessToken: 'Bearer access' }),
          response,
        );

        expect(result).toBe(claims);
        expect(tokenService.checkAccessToken).toHaveBeenCalledWith('access');
        expect(tokenService.appendTokenCookies).not.toHaveBeenCalled();
      });
    });

    describe('when the access token is expired and the refresh token is valid', () => {
      it('should set new token cookies and return the new access token claims', async () => {
        tokenService.checkAccessToken.mockReturnValue({
          isValid: false,
          decodedToken: claims,
        });
        tokenService.decodeToken.mockImplementation((token) =>
          token === 'refresh' ? claims : newClaims,
        );
        tokenService.checkRefreshToken.mockReturnValue({ isValid: true });
        const newTokens = {
          id: 1,
          accessToken: 'Bearer new-access',
          refreshToken: 'Bearer new-refresh',
        };
        tokenService.generateTokens.mockReturnValue(
          newTokens as ReturnType<TokenService['generateTokens']>,
        );
        const request = requestWith({
          accessToken: 'Bearer access',
          refreshToken: 'Bearer refresh',
        });

        const result = await service.getCurrentUserClaims(request, response);

        expect(tokenService.checkRefreshToken).toHaveBeenCalledWith(
          'refresh',
          'secret',
        );
        expect(tokenService.appendTokenCookies).toHaveBeenCalledWith(
          response,
          newTokens,
        );
        expect(tokenService.decodeToken).toHaveBeenLastCalledWith('new-access');
        expect(result).toBe(newClaims);
        expect(request.currentUser).toBeDefined();
      });
    });

    describe('when the access token is expired and there is no refresh token', () => {
      it('should throw unauthorized without renewing the tokens', async () => {
        tokenService.checkAccessToken.mockReturnValue({
          isValid: false,
          decodedToken: claims,
        });

        await expect(
          service.getCurrentUserClaims(
            requestWith({ accessToken: 'Bearer access' }),
            response,
          ),
        ).rejects.toBeInstanceOf(Unauthorized);
        expect(tokenService.appendTokenCookies).not.toHaveBeenCalled();
      });
    });

    describe('when the refresh token is not valid (e.g. revoked on logout)', () => {
      it('should throw unauthorized without renewing the tokens', async () => {
        tokenService.checkAccessToken.mockReturnValue({
          isValid: false,
          decodedToken: claims,
        });
        tokenService.decodeToken.mockReturnValue(claims);
        tokenService.checkRefreshToken.mockReturnValue({
          isValid: false,
          errorMessage: 'El refresh token no es válido',
        });

        await expect(
          service.getCurrentUserClaims(
            requestWith({
              accessToken: 'Bearer access',
              refreshToken: 'Bearer refresh',
            }),
            response,
          ),
        ).rejects.toBeInstanceOf(Unauthorized);
        expect(tokenService.appendTokenCookies).not.toHaveBeenCalled();
      });
    });

    describe('when the refresh token belongs to a missing or deleted user', () => {
      it('should throw unauthorized without renewing the tokens', async () => {
        tokenService.checkAccessToken.mockReturnValue({
          isValid: false,
          decodedToken: claims,
        });
        tokenService.decodeToken.mockReturnValue(claims);
        findOne.mockResolvedValue(null);

        await expect(
          service.getCurrentUserClaims(
            requestWith({
              accessToken: 'Bearer access',
              refreshToken: 'Bearer refresh',
            }),
            response,
          ),
        ).rejects.toBeInstanceOf(Unauthorized);
        expect(tokenService.checkRefreshToken).not.toHaveBeenCalled();
        expect(tokenService.appendTokenCookies).not.toHaveBeenCalled();
      });
    });

    describe('when no cookies are sent', () => {
      it('should throw unauthorized', async () => {
        await expect(
          service.getCurrentUserClaims(requestWith(undefined), response),
        ).rejects.toBeInstanceOf(Unauthorized);
      });
    });
  });
});
