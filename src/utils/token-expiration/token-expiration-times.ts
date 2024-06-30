export type ExpirationTime = {
  value: number;
  dimension: 'days' | 'hours' | 'minutes' | 'seconds';
};

export interface ITokenExpirationTimes {
  getTokenExpirationShortVersion(key: string): string;

  getTokenExpirationInDurationFormat(key: string): {
    [x: string]: number;
  };
}

export type ExpirationsMap = Partial<{
  [key in AcceptedTokens]: ExpirationTime;
}>;

export enum AcceptedTokens {
  AccessToken = 'accessToken',
  RefreshToken = 'refreshToken',
  EmailVerificationToken = 'emailVerificationToken',
}
export class TokenExpirationTimes implements ITokenExpirationTimes {
  constructor(private readonly expirationTokenTimes: ExpirationsMap) {}

  private timeScalesMappings = {
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
  };

  getTokenExpirationShortVersion(key: AcceptedTokens) {
    const expirationTokenTime = this.expirationTokenTimes[key];
    const dimensionShortVersion =
      this.timeScalesMappings[expirationTokenTime.dimension];

    return `${expirationTokenTime.value}${dimensionShortVersion}`;
  }

  getTokenExpirationInDurationFormat(key: AcceptedTokens) {
    const expirationTokenTime = this.expirationTokenTimes[key];
    return {
      [expirationTokenTime.dimension]: expirationTokenTime.value,
    };
  }
}
