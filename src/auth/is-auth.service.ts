import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { TokenService } from './token.service';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { RequestWithUser } from '../utils/request-with-user';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { CurrentUserWithoutTokens } from './dtos/current-user.dto';
import { PinoLogger } from 'nestjs-pino';
import { GeneralTokenDecoded } from './dtos/token';

@Injectable()
export class IsAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IsAuthService.name);
  }

  getCurrentUserDisplayInfo = (accessTokenCookie: string) => {
    const accessToken: string | undefined = accessTokenCookie?.replace(
      'Bearer ',
      '',
    );

    if (!accessToken) throw new Unauthorized('AccessToken cookie not provided');

    const accessTokenVerificationResult =
      this.tokenService.checkAccessToken(accessToken);

    if (!accessTokenVerificationResult.isValid)
      throw new Unauthorized('Not valid access token');

    return accessTokenVerificationResult.decodedToken;
  };

  async setCurrentUser(httpContext: HttpArgumentsHost) {
    const request: RequestWithUser = httpContext.getRequest();

    if (!request.cookies) throw new Unauthorized('Cookie not provided');

    const accessToken: string | undefined = request.cookies[
      'accessToken'
    ]?.replace('Bearer ', '');

    const accessTokenVerificationResult = await this.verifyAccessToken(
      accessToken,
    );

    if (!accessTokenVerificationResult.isValid) {
      const refreshToken: string | undefined = request.cookies[
        'refreshToken'
      ]?.replace('Bearer ', '');

      const response: Response = httpContext.getResponse();
      return await this.appendNewTokensIfRefreshTokenIsValid(
        refreshToken,
        request,
        response,
        accessTokenVerificationResult.tokenDecoded,
      );
    }

    request.currentUser = this.entityMapper.mapValue(
      CurrentUserWithoutTokens,
      accessTokenVerificationResult.tokenDecoded,
    );
  }

  private async verifyAccessToken(accessToken: string): Promise<{
    isValid: boolean;
    tokenDecoded?: GeneralTokenDecoded;
  }> {
    if (!accessToken) {
      this.logger.debug('AccessToken cookie not provided');
      return { isValid: false };
    }

    const accessTokenVerificationResult =
      this.tokenService.checkAccessToken(accessToken);

    return {
      isValid: accessTokenVerificationResult.isValid,
      tokenDecoded: accessTokenVerificationResult.decodedToken,
    };
  }

  private async appendNewTokensIfRefreshTokenIsValid(
    refreshToken: string | undefined,
    request: RequestWithUser,
    response: Response,
    accessTokenDecoded?: GeneralTokenDecoded,
  ) {
    if (!refreshToken) throw new Unauthorized('Refresh token not provided');

    const decodedRefreshToken = this.tokenService.decodeToken(refreshToken);

    if (!decodedRefreshToken) {
      throw new Unauthorized('Refresh token incorrectly formatted');
    }

    if (
      accessTokenDecoded &&
      decodedRefreshToken.id !== accessTokenDecoded.id
    ) {
      throw new Unauthorized("Tokens associated ids don't match");
    }

    const user = await this.userRepo
      .findOne({
        where: { id: decodedRefreshToken.id },
      })
      .catch((err) => {
        this.logger.error(err);
        throw new Unauthorized("Token's associated id doesn't match any user");
      });

    const refreshTokenValidationResult = this.tokenService.checkRefreshToken(
      refreshToken,
      user.refreshUserSecret,
    );

    if (!refreshTokenValidationResult.isValid)
      throw new Unauthorized(refreshTokenValidationResult.errorMessage);

    const currentUser = this.tokenService.generateTokens(user);
    this.tokenService.appendTokenCookies(response, currentUser);

    request.currentUser = this.entityMapper.mapValue(
      CurrentUserWithoutTokens,
      currentUser,
    );
  }
}
