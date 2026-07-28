import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { randomToken } from "@/lib/crypto";
import { logAuthEvent } from "@/lib/logger";
import { OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE_SECONDS } from "@/lib/oauth";
import { SESSION_COOKIE_OPTIONS } from "@/lib/session-cookie";

/**
 * Starts the Google OAuth flow server-side so an anti-CSRF `state` value can be
 * bound to an httpOnly cookie. The client never builds the authorization URL.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    logAuthEvent("OAUTH_GOOGLE_NOT_CONFIGURED", {});

    return NextResponse.redirect(
      new URL("/login?error=Google+sign-in+is+not+configured+on+this+server", request.url),
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const state = randomToken(16);

  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", `${appUrl}/api/auth/callback/google`);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizationUrl);

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });

  return response;
}
