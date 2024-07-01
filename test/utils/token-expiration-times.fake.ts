import {
  AcceptedTokens,
  ExpirationTime,
  ITokenExpirationTimes,
  TokenExpirationTimes,
} from '../../src/utils/token-expiration/token-expiration-times';

export class TokenExpirationTimesFake implements ITokenExpirationTimes {
  private tokenExpirations: Partial<{
    [key in AcceptedTokens]: ExpirationTime;
  }> = {};

  constructor(
    private readonly originalParams: Partial<{
      [key in AcceptedTokens]: ExpirationTime;
    }>,
  ) {
    Object.assign(this.tokenExpirations, originalParams);
  }

  getTokenExpirationShortVersion(key: AcceptedTokens): string {
    const tokenExpirationTimes = new TokenExpirationTimes(
      this.tokenExpirations,
    );
    return tokenExpirationTimes.getTokenExpirationShortVersion(key);
  }
  getTokenExpirationInDurationFormat(key: AcceptedTokens): {
    [x: string]: number;
  } {
    const tokenExpirationTimes = new TokenExpirationTimes(
      this.tokenExpirations,
    );
    return tokenExpirationTimes.getTokenExpirationInDurationFormat(key);
  }

  set(tokenExpirations: Partial<{ [key in AcceptedTokens]: ExpirationTime }>) {
    Object.entries(tokenExpirations).forEach(([key, expirationTime]) => {
      this.tokenExpirations[key] = expirationTime;
    });
  }

  restore() {
    Object.assign(this.tokenExpirations, this.originalParams);
  }
}
