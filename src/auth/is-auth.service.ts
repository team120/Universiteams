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

@Injectable()
export class IsAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly entityMapper: EntityMapperService,
  ) {}

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
      this.appendNewTokensIfRefreshTokenIsValid(
        refreshToken,
        accessTokenVerificationResult.user,
        response,
      );
    }

    request.currentUser = this.entityMapper.mapValue(
      CurrentUserWithoutTokens,
      accessTokenVerificationResult.user,
    );
  }

  private async verifyAccessToken(accessToken: string) {
    if (!accessToken) throw new Unauthorized('Access token not provided');

    const accessTokenVerificationResult =
      this.tokenService.checkAccessToken(accessToken);

    const user = await this.userRepo.findOne({
      where: { id: accessTokenVerificationResult.decodedToken.id },
    });

    if (!user)
      throw new Unauthorized("Token's associated id doesn't match any user");

    return { isValid: accessTokenVerificationResult.isValid, user: user };
  }

  private appendNewTokensIfRefreshTokenIsValid(
    refreshToken: string | undefined,
    user: User,
    response: Response,
  ) {
    if (!refreshToken) throw new Unauthorized('Refresh token not provided');

    const refreshTokenValidationResult = this.tokenService.checkRefreshToken(
      refreshToken,
      user,
    );

    if (!refreshTokenValidationResult.isValid)
      throw new Unauthorized(refreshTokenValidationResult.errorMessage);

    const currentUser = this.tokenService.generateTokens(user);
    this.tokenService.appendTokenCookies(response, currentUser);
  }
}
