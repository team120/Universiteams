import { Test } from '@nestjs/testing';
import {
  ExpirationTime,
  TokenExpirationTimes,
} from '../../src/auth/token-expiration-times';
import { ProjectModule } from '../../src/project/project.module';
import { CURRENT_DATE_SERVICE } from '../../src/utils/current-date';
import { commonImportsArray } from '../utils/common-imports.e2e';
import { CurrentDateE2EMock } from '../utils/current-date.e2e-mock';

export const createProjectTestingApp = async () => {
  const tokenExpirationTimesTesting = new TokenExpirationTimesTesting({
    accessTokenExpiration: {
      value: 15,
      dimension: 'minutes',
    },
    refreshTokenExpiration: { value: 7, dimension: 'days' },
  });

  const moduleFixture = await Test.createTestingModule({
    imports: [...commonImportsArray, ProjectModule],
  })
    .overrideProvider(CURRENT_DATE_SERVICE)
    .useValue(new CurrentDateE2EMock())
    .overrideProvider(TokenExpirationTimes)
    .useValue(tokenExpirationTimesTesting)
    .compile();

  return {
    app: moduleFixture.createNestApplication(),
    tokenExpirationTimesTesting: tokenExpirationTimesTesting,
  };
};

export class TokenExpirationTimesTesting extends TokenExpirationTimes {
  private readonly originalParams: {
    accessTokenExpiration: ExpirationTime;
    refreshTokenExpiration: ExpirationTime;
  };

  constructor(params: {
    accessTokenExpiration: ExpirationTime;
    refreshTokenExpiration: ExpirationTime;
  }) {
    super(params);
    this.originalParams = params;
  }

  set(params: {
    accessTokenExpiration?: ExpirationTime;
    refreshTokenExpiration?: ExpirationTime;
  }) {
    this.accessTokenExpiration =
      params.accessTokenExpiration ?? this.originalParams.accessTokenExpiration;
    this.refreshTokenExpiration =
      params.refreshTokenExpiration ??
      this.originalParams.refreshTokenExpiration;
  }

  restore() {
    this.accessTokenExpiration = this.originalParams.accessTokenExpiration;
    this.refreshTokenExpiration = this.originalParams.refreshTokenExpiration;
  }
}
