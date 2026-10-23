export type SameSitePolicy = 'strict' | 'lax' | 'none';

export interface CookieSettings {
  sameSite: SameSitePolicy;
  secure: boolean;
}

const sameSitePolicies: SameSitePolicy[] = ['strict', 'lax', 'none'];

const isSameSitePolicy = (value: string): value is SameSitePolicy =>
  (sameSitePolicies as string[]).includes(value);

// Env values are strings, so 'false' must be parsed: passed as is, it's truthy
export const parseCookieSettings = (
  sameSitePolicy: string | undefined,
  secureCookie: string | undefined,
): CookieSettings => {
  const sameSite = sameSitePolicy?.trim().toLowerCase() ?? '';
  if (!isSameSitePolicy(sameSite))
    throw new Error(
      `SAME_SITE_POLICY must be one of ${sameSitePolicies.join(
        ', ',
      )}, got "${sameSitePolicy}"`,
    );

  const secure = secureCookie?.trim().toLowerCase();
  if (secure !== 'true' && secure !== 'false')
    throw new Error(
      `SECURE_COOKIE must be true or false, got "${secureCookie}"`,
    );

  // Browsers reject SameSite=None cookies that aren't Secure
  if (sameSite === 'none' && secure === 'false')
    throw new Error(
      'SAME_SITE_POLICY=none requires SECURE_COOKIE=true: browsers reject SameSite=None cookies without Secure',
    );

  return { sameSite, secure: secure === 'true' };
};
