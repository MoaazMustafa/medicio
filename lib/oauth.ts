/** Shared constants for the Google OAuth authorization-code flow. */

export const OAUTH_STATE_COOKIE = "medicio_oauth_state";

export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60; // 10 minutes

/** Sentinel stored in `passwordHash` for accounts created via an identity provider. */
export const OAUTH_ONLY_PASSWORD_HASH = "OAUTH_ONLY_NO_PASSWORD";
