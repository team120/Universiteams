import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { CurrentUserWithoutTokens } from './dtos/current-user.dto';
import { RequestWithUser } from '../utils/request-with-user';
import { Response } from 'express';
import { IsAuthService } from './is-auth.service';

@Injectable()
export class IsAuthGuard implements CanActivate {
  constructor(
    private readonly isAuthCheck: IsAuthService,
    private readonly entityMapper: EntityMapperService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const httpContext = context.switchToHttp();
    const request: RequestWithUser = httpContext.getRequest();
    const response: Response = httpContext.getResponse();

    if (!request.cookies) throw new Unauthorized('Cookie not provided');
    const l = request.cookies['refreshToken'];
    const accessToken: string | undefined = request.cookies[
      'accessToken'
    ]?.replace('Bearer ', '');

    const accessTokenVerificationResult =
      await this.isAuthCheck.verifyAccessToken(accessToken);

    if (!accessTokenVerificationResult.isValid) {
      const refreshToken: string | undefined = request.cookies[
        'refreshToken'
      ]?.replace('Bearer ', '');

      this.isAuthCheck.appendNewTokensIfRefreshTokenIsValid(
        refreshToken,
        accessTokenVerificationResult.user,
        response,
      );
    }

    request.currentUser = this.entityMapper.mapValue(
      CurrentUserWithoutTokens,
      accessTokenVerificationResult.user,
    );

    return true;
  }
}
