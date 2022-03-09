import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTokenPayload } from '../auth/dtos/token';
import { SecretsVaultKeys } from '../utils/secrets';
import * as jwt from 'jsonwebtoken';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Unauthorized } from '../utils/exceptions/exceptions';
import {
  AcceptedTokens,
  TokenExpirationTimes,
} from '../utils/token-expiration/token-expiration-times';
import * as argon2 from 'argon2';
import { Buffer } from 'buffer';
import { User } from '../user/user.entity';

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

  generateForgetPasswordUrl(user: User) {
    return this.generateVerificationUrl(
      user,
      AcceptedTokens.EmailVerificationToken,
      this.config.get(
        SecretsVaultKeys.FORGET_PASSWORD_VERIFICATION_LINK_SECRET,
      ),
      'http://localhost:5000/account/reset-password',
    );
  }

  private async generateVerificationUrl(
    user: User,
    expirationTimeOfToken: AcceptedTokens,
    secret: string,
    baseUrl: string,
  ) {
    const tokenPayload: EmailTokenPayload = {
      identityHash: await this.computeUserHash(user),
    };
    const expiration = this.tokenExpirationTimes.getTokenExpirationShortVersion(
      expirationTimeOfToken,
    );
    const jwtVerification: string = jwt.sign(tokenPayload, secret, {
      expiresIn: expiration,
    });

    return `${baseUrl}?token=${jwtVerification}`;
  }

  async checkVerificationEmailToken(verificationToken: string, user: User) {
    const decodedToken = this.checkVerificationToken(
      verificationToken,
      this.config.get(SecretsVaultKeys.EMAIL_VERIFICATION_LINK_SECRET),
    );
    await this.checkUserIdentityHash(decodedToken, user);

    return decodedToken;
  }

  async checkForgetPasswordToken(verificationToken: string, user: User) {
    const decodedToken = this.checkVerificationToken(
      verificationToken,
      this.config.get(
        SecretsVaultKeys.FORGET_PASSWORD_VERIFICATION_LINK_SECRET,
      ),
    );
    await this.checkUserIdentityHash(decodedToken, user);

    return decodedToken;
  }

  private checkVerificationToken(verificationToken: string, secret: string) {
    try {
      return this.entityMapper.mapValue(
        EmailTokenPayload,
        jwt.verify(verificationToken, secret),
      );
    } catch (err) {
      throw new Unauthorized(err);
    }
  }

  private async checkUserIdentityHash(
    decodedToken: EmailTokenPayload,
    user: User,
  ) {
    const computedUserHash = await this.computeUserHash(user);
    if (decodedToken.identityHash !== computedUserHash)
      throw new Unauthorized('User identity hash does not match token');
  }

  private computeUserHash(user: User) {
    return argon2.hash(
      user.id.toString().concat(user.email).concat(user.refreshUserSecret),
      {
        salt: Buffer.alloc(10, 1),
      },
    );
  }
}
