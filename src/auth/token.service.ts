import { User } from '../user/user.entity';
import { SecretsVaultKeys } from '../utils/secrets';
import { CurrentUserDto } from './dtos/current-user.dto';
import { GeneralTokenDecoded, GeneralTokenPayload } from './dtos/token';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Response } from 'express';
import { add } from 'date-fns';
import { Injectable } from '@nestjs/common';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { PinoLogger } from 'nestjs-pino';
import {
  AcceptedTokens,
  TokenExpirationTimes,
} from '../utils/token-expiration/token-expiration-times';

@Injectable()
export class TokenService {
  constructor(
    private readonly entityMapper: EntityMapperService,
    private readonly configService: ConfigService,
    private readonly tokenExpirationTimes: TokenExpirationTimes,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TokenService.name);
  }

  generateTokens(user: User) {
    const tokenPayload: GeneralTokenPayload = {
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
          expiresIn: this.tokenExpirationTimes.getTokenExpirationShortVersion(
            AcceptedTokens.AccessToken,
          ),
        },
      )}`,
      refreshToken: `Bearer ${jwt.sign(
        tokenPayload,
        this.configService.get(SecretsVaultKeys.REFRESH_TOKEN) +
          user.refreshUserSecret,
        {
          expiresIn: this.tokenExpirationTimes.getTokenExpirationShortVersion(
            AcceptedTokens.RefreshToken,
          ),
        },
      )}`,
    });
  }

  checkAccessToken(accessToken: string): {
    decodedToken: GeneralTokenDecoded;
    isValid: boolean;
  } {
    try {
      const token = this.entityMapper.mapValue(
        GeneralTokenDecoded,
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
      this.logger.error(err);

      if (!(err instanceof jwt.TokenExpiredError))
        throw new Unauthorized('Access token incorrectly formatted');

      const token = this.entityMapper.mapValue(
        GeneralTokenDecoded,
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
        GeneralTokenDecoded,
        jwt.verify(
          refreshToken,
          this.configService.get(SecretsVaultKeys.REFRESH_TOKEN) +
            accessTokenUser.refreshUserSecret,
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
    } catch (err) {
      this.logger.error(err);
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
      sameSite: this.configService.get(SecretsVaultKeys.SAME_SITE_POLICY),
      secure: this.configService.get(SecretsVaultKeys.SECURE_COOKIE),     
    });
    response.cookie('refreshToken', currentUser.refreshToken, {
      expires: add(
        new Date(),
        this.tokenExpirationTimes.getTokenExpirationInDurationFormat(
          AcceptedTokens.RefreshToken,
        ),
      ),
      httpOnly: true,
      sameSite: this.configService.get(SecretsVaultKeys.SAME_SITE_POLICY),
      secure: this.configService.get(SecretsVaultKeys.SECURE_COOKIE),  
    });
  }
}
