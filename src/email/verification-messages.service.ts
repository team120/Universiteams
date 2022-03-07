import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenDecoded, TokenPayload } from '../auth/dtos/token';
import { User } from '../user/user.entity';
import { SecretsVaultKeys } from '../utils/secrets';
import * as jwt from 'jsonwebtoken';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Unauthorized } from '../utils/exceptions/exceptions';
import {
  AcceptedTokens,
  TokenExpirationTimes,
} from '../utils/token-expiration/token-expiration-times';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';

@Injectable()
export class VerificationMessagesService {
  constructor(
    private readonly tokenExpirationTimes: TokenExpirationTimes,
    private readonly config: ConfigService,
    private readonly entityMapper: EntityMapperService,
  ) {}

  generateVerifyEmailUrl(user: User) {
    return this.generateVerificationUrl(
      user,
      AcceptedTokens.EmailVerificationToken,
      this.config.get(SecretsVaultKeys.EMAIL_VERIFICATION_LINK_SECRET),
      'http://localhost:5000/account/verify',
    );
  }

  generateForgetPasswordUrl(user: CurrentUserWithoutTokens) {
    return this.generateVerificationUrl(
      user,
      AcceptedTokens.EmailVerificationToken,
      this.config.get(
        SecretsVaultKeys.FORGET_PASSWORD_VERIFICATION_LINK_SECRET,
      ),
      'http://localhost:5000/account/reset-password',
    );
  }

  private generateVerificationUrl(
    user: CurrentUserWithoutTokens,
    expirationTimeOfToken: AcceptedTokens,
    secret: string,
    baseUrl: string,
  ) {
    const tokenPayload: TokenPayload = {
      id: user.id,
      user: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };
    const expiration = this.tokenExpirationTimes.getTokenExpirationShortVersion(
      expirationTimeOfToken,
    );
    const jwtVerification: string = jwt.sign(tokenPayload, secret, {
      expiresIn: expiration,
    });

    return `${baseUrl}?token=${jwtVerification}`;
  }

  checkVerifyEmailToken(verificationToken: string) {
    return this.checkVerificationToken(
      verificationToken,
      this.config.get(SecretsVaultKeys.EMAIL_VERIFICATION_LINK_SECRET),
    );
  }

  checkForgetPasswordToken(verificationToken: string) {
    return this.checkVerificationToken(
      verificationToken,
      this.config.get(
        SecretsVaultKeys.FORGET_PASSWORD_VERIFICATION_LINK_SECRET,
      ),
    );
  }

  private checkVerificationToken(verificationToken: string, secret: string) {
    try {
      return this.entityMapper.mapValue(
        TokenDecoded,
        jwt.verify(verificationToken, secret),
      );
    } catch (err) {
      throw new Unauthorized(err);
    }
  }
}
