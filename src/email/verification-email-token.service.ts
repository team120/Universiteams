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

@Injectable()
export class VerificationEmailTokenService {
  constructor(
    private readonly tokenExpirationTimes: TokenExpirationTimes,
    private readonly config: ConfigService,
    private readonly entityMapper: EntityMapperService,
  ) {}

  generateVerificationUrl(user: User) {
    const tokenPayload: TokenPayload = {
      id: user.id,
      user: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };
    const expiration = this.tokenExpirationTimes.getTokenExpirationShortVersion(
      AcceptedTokens.EmailVerificationToken,
    );
    const jwtVerification: string = jwt.sign(
      tokenPayload,
      this.config.get(SecretsVaultKeys.VERIFICATION_LINK_SECRET),
      {
        expiresIn: expiration,
      },
    );

    return `http://localhost:5000/account/verify?token=${jwtVerification}`;
  }

  checkToken(verificationToken: string) {
    try {
      return this.entityMapper.mapValue(
        TokenDecoded,
        jwt.verify(
          verificationToken,
          this.config.get(SecretsVaultKeys.VERIFICATION_LINK_SECRET),
        ),
      );
    } catch (err) {
      throw new Unauthorized(err);
    }
  }
}
