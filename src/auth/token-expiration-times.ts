export type ExpirationTime = {
  value: number;
  dimension: 'days' | 'hours' | 'minutes' | 'seconds';
};

export class TokenExpirationTimes {
  protected accessTokenExpiration: ExpirationTime;
  protected refreshTokenExpiration: ExpirationTime;
  constructor(params: {
    accessTokenExpiration: ExpirationTime;
    refreshTokenExpiration: ExpirationTime;
  }) {
    this.accessTokenExpiration = params.accessTokenExpiration;
    this.refreshTokenExpiration = params.refreshTokenExpiration;
  }

  private timeScalesMappings = {
    days: 'd',
    hours: 'h',
    minutes: 'm',
    seconds: 's',
  };

  getAccessTokenExpirationShortVersion() {
    const dimensionShortVersion =
      this.timeScalesMappings[this.accessTokenExpiration.dimension];
    return `${this.accessTokenExpiration.value}${dimensionShortVersion}`;
  }
  getRefreshTokenExpirationShortVersion() {
    const dimensionShortVersion =
      this.timeScalesMappings[this.refreshTokenExpiration.dimension];
    return `${this.refreshTokenExpiration.value}${dimensionShortVersion}`;
  }
  getAccessTokenExpirationInDurationFormat() {
    return {
      [this.accessTokenExpiration.dimension]: this.accessTokenExpiration.value,
    };
  }
  getRefreshTokenExpirationInDurationFormat() {
    return {
      [this.refreshTokenExpiration.dimension]:
        this.refreshTokenExpiration.value,
    };
  }
}
