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
      this.config.get(SecretsVaultKeys.EMAIL_CONFIRMATION_URL),
    );
  }

  generateForgetPasswordUrl(user: User) {
    return this.generateVerificationUrl(
      user,
      AcceptedTokens.EmailVerificationToken,
      this.config.get(
        SecretsVaultKeys.FORGET_PASSWORD_VERIFICATION_LINK_SECRET,
      ),
      this.config.get(SecretsVaultKeys.FORGET_PASSWORD_URL),
    );
  }

  private async generateVerificationUrl(
    user: User,
    expirationTimeOfToken: AcceptedTokens,
    secret: string,
    baseUrl: string,
  ) {
    const tokenPayload: EmailTokenPayload = {
      identityHash: await argon2.hash(this.userIdentityHashData(user)),
      email: user.email,
      user: `${user.firstName} ${user.lastName}`,
      id: user.id,
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

  async checkForgetPasswordToken(decodedToken: EmailTokenPayload, user: User) {
    await this.checkUserIdentityHash(decodedToken, user);

    return decodedToken;
  }

  checkVerificationToken(verificationToken: string, secret: string) {
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
    const hashMatches = await argon2.verify(
      decodedToken.identityHash,
      this.userIdentityHashData(user),
    );
    if (!hashMatches)
      throw new Unauthorized('User identity hash does not match token');
  }

  private userIdentityHashData(user: User) {
    return user.id.toString().concat(user.email).concat(user.refreshUserSecret);
  }
}
