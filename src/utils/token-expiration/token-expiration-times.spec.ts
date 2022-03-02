import { AcceptedTokens, TokenExpirationTimes } from './token-expiration-times';

describe('TokenExpirationTimes', () => {
  describe('getAccessTokenExpirationShortVersion', () => {
    describe('when token expires in some valid dimension period', () => {
      it.each([
        [1, 'days', '1d'],
        [20, 'minutes', '20m'],
        [24, 'hours', '24h'],
        [13, 'days', '13d'],
        [400, 'seconds', '400s'],
        [0, 'minutes', '0m'],
      ])(
        'should return the expiration short version',
        (
          value: number,
          dimension: 'days' | 'hours' | 'minutes' | 'seconds',
          expectedShortVersion: string,
        ) => {
          const tokenExpirationTimes = new TokenExpirationTimes({
            accessToken: {
              value: value,
              dimension: dimension,
            },
            refreshToken: { value: value, dimension: dimension },
          });
          const shortExpirationAccessToken =
            tokenExpirationTimes.getTokenExpirationShortVersion(
              AcceptedTokens.AccessToken,
            );
          const shortExpirationRefreshToken =
            tokenExpirationTimes.getTokenExpirationShortVersion(
              AcceptedTokens.RefreshToken,
            );

          expect(shortExpirationAccessToken).toBe(expectedShortVersion);
          expect(shortExpirationRefreshToken).toBe(expectedShortVersion);
        },
      );
    });
  });
});
