import { parseCookieSettings } from './cookie-settings';

describe('parseCookieSettings', () => {
  describe('when both values are valid', () => {
    it.each([
      ['strict', 'true', { sameSite: 'strict', secure: true }],
      ['strict', 'false', { sameSite: 'strict', secure: false }],
      ['lax', 'false', { sameSite: 'lax', secure: false }],
      ['none', 'true', { sameSite: 'none', secure: true }],
      [' Lax ', ' FALSE ', { sameSite: 'lax', secure: false }],
    ])(
      'should parse SAME_SITE_POLICY=%p and SECURE_COOKIE=%p',
      (sameSitePolicy, secureCookie, expected) => {
        expect(parseCookieSettings(sameSitePolicy, secureCookie)).toEqual(
          expected,
        );
      },
    );
  });

  describe('when SECURE_COOKIE is "false"', () => {
    it('should return a real false, not a truthy string', () => {
      expect(parseCookieSettings('lax', 'false').secure).toBe(false);
    });
  });

  describe('when SAME_SITE_POLICY is not strict, lax or none', () => {
    it.each([undefined, '', 'nonee', 'true'])(
      'should throw for %p',
      (sameSitePolicy) => {
        expect(() => parseCookieSettings(sameSitePolicy, 'true')).toThrow(
          'SAME_SITE_POLICY must be one of strict, lax, none',
        );
      },
    );
  });

  describe('when SECURE_COOKIE is not true or false', () => {
    it.each([undefined, '', '1', 'yes'])('should throw for %p', (secure) => {
      expect(() => parseCookieSettings('strict', secure)).toThrow(
        'SECURE_COOKIE must be true or false',
      );
    });
  });

  describe('when SAME_SITE_POLICY is none and SECURE_COOKIE is false', () => {
    it('should throw, since browsers reject that cookie', () => {
      expect(() => parseCookieSettings('none', 'false')).toThrow(
        'SAME_SITE_POLICY=none requires SECURE_COOKIE=true',
      );
    });
  });
});
