import {
  AcceptedTokens,
  ExpirationTime,
  ITokenExpirationTimes,
  TokenExpirationTimes,
} from '../../src/utils/token-expiration/token-expiration-times';

export class TokenExpirationTimesFake implements ITokenExpirationTimes {
  private readonly originalParams: Partial<
    { [key in AcceptedTokens]: ExpirationTime }
  >;
  tokenExpirations: Partial<{ [key in AcceptedTokens]: ExpirationTime }>;

  constructor(params: Partial<{ [key in AcceptedTokens]: ExpirationTime }>) {
    this.originalParams = params;
    this.tokenExpirations = params;
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
    this.tokenExpirations = this.originalParams;
  }
}
