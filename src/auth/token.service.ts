import { User } from '../user/user.entity';
import { SecretsVaultKeys } from '../utils/secrets';
import { CurrentUserDto } from './dtos/current-user.dto';
import { TokenDecoded, TokenPayload } from './dtos/token';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Response } from 'express';
import { add } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { TokenExpirationTimes } from './token-expiration-times';

@Injectable()
export class TokenService {
  constructor(
    private readonly entityMapper: EntityMapperService,
    private readonly configService: ConfigService,
    private readonly tokenExpirationTimes: TokenExpirationTimes,
  ) {}

  generateTokens(user: User) {
    const tokenPayload: TokenPayload = {
      id: user.id,
      user: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };

    return this.entityMapper.mapValue(CurrentUserDto, {
      ...user,
      accessToken: `Bearer ${jwt.sign(
        tokenPayload,
        this.configService.get(SecretsVaultKeys.ACCESS_TOKEN),
        {
          expiresIn:
            this.tokenExpirationTimes.getAccessTokenExpirationShortVersion(),
        },
      )}`,
      refreshToken: `Bearer ${jwt.sign(
        tokenPayload,
        this.configService.get(SecretsVaultKeys.REFRESH_TOKEN) +
          user.refreshTokenSecret,
        {
          expiresIn:
            this.tokenExpirationTimes.getRefreshTokenExpirationShortVersion(),
        },
      )}`,
    });
  }

  checkAccessToken(accessToken: string): {
    decodedToken: TokenDecoded;
    isValid: boolean;
  } {
    try {
      const token = this.entityMapper.mapValue(
        TokenDecoded,
        jwt.verify(
          accessToken,
          this.configService.get(SecretsVaultKeys.ACCESS_TOKEN),
        ),
      );
      return {
        decodedToken: token,
        isValid: true,
      };
    } catch (err) {
      if (!(err instanceof jwt.TokenExpiredError))
        throw new Unauthorized('Access token incorrectly formatted');
      const token = this.entityMapper.mapValue(
        TokenDecoded,
        jwt.decode(
          accessToken,
          this.configService.get(SecretsVaultKeys.ACCESS_TOKEN),
        ),
      );
      return {
        decodedToken: token,
        isValid: false,
      };
    }
  }

  checkRefreshToken(
    refreshToken: string,
    accessTokenUser: User,
  ): {
    isValid: boolean;
    errorMessage?: string;
  } {
    try {
      const decodedRefreshToken = this.entityMapper.mapValue(
        TokenDecoded,
        jwt.verify(
          refreshToken,
          this.configService.get(SecretsVaultKeys.REFRESH_TOKEN) +
            accessTokenUser.refreshTokenSecret,
        ),
      );
      if (decodedRefreshToken.id !== accessTokenUser.id)
        return {
          isValid: false,
          errorMessage:
            "Refresh token userId doesn't match access token respective one",
        };
      return {
        isValid: true,
      };
    } catch {
      return {
        isValid: false,
        errorMessage: 'Refresh token is invalid',
      };
    }
  }

  appendTokenCookies(response: Response, currentUser: CurrentUserDto) {
    response.cookie('accessToken', currentUser.accessToken, {
      expires: add(new Date(), { days: 1 }),
      httpOnly: true,
      sameSite: 'strict',
    });
    response.cookie('refreshToken', currentUser.refreshToken, {
      expires: add(
        new Date(),
        this.tokenExpirationTimes.getRefreshTokenExpirationInDurationFormat(),
      ),
      httpOnly: true,
      sameSite: 'strict',
    });
  }
}
