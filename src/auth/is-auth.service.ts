import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { Unauthorized } from '../utils/exceptions/exceptions';
import { TokenService } from './token.service';

@Injectable()
export class IsAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tokenService: TokenService,
  ) {}

  async verifyAccessToken(accessToken: string) {
    if (!accessToken) throw new Unauthorized('Access token not provided');

    const accessTokenVerificationResult =
      this.tokenService.checkAccessToken(accessToken);

    const user = await this.userRepo.findOne(
      accessTokenVerificationResult.decodedToken.id,
    );

    if (!user)
      throw new Unauthorized("Token's associated id doesn't match any user");

    return { isValid: accessTokenVerificationResult.isValid, user: user };
  }

  appendNewTokensIfRefreshTokenIsValid(
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
