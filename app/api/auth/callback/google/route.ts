import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { dashboardForRole } from "@/config/roles";
import { signSessionToken } from "@/lib/auth";
import { logAuthEvent } from "@/lib/logger";
import { OAUTH_ONLY_PASSWORD_HASH, OAUTH_STATE_COOKIE } from "@/lib/oauth";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/session-cookie";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  // The state cookie is single-use regardless of the outcome below.
  cookieStore.delete(OAUTH_STATE_COOKIE);

  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      logAuthEvent("OAUTH_GOOGLE_PROVIDER_ERROR", { error });

      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
    }

    // CSRF protection: the callback must echo the state we issued.
    if (!state || !expectedState || state !== expectedState) {
      logAuthEvent("OAUTH_GOOGLE_STATE_MISMATCH", {});

      return NextResponse.redirect(
        new URL("/login?error=Invalid+or+expired+sign-in+request.+Please+try+again", request.url),
      );
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=Missing+oauth+authorization+code", request.url));
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      logAuthEvent("OAUTH_GOOGLE_NOT_CONFIGURED", {});

      return NextResponse.redirect(new URL("/login?error=Google+OAuth+is+not+configured+on+server", request.url));
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      logAuthEvent("OAUTH_GOOGLE_TOKEN_EXCHANGE_FAILURE", { status: tokenResponse.status });

      return NextResponse.redirect(new URL("/login?error=Failed+to+exchange+google+tokens", request.url));
    }

    // 2. Query user profile info from Google API
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userinfoResponse.json();

    if (!userinfoResponse.ok) {
      logAuthEvent("OAUTH_GOOGLE_USERINFO_FAILURE", { status: userinfoResponse.status });

      return NextResponse.redirect(new URL("/login?error=Failed+to+fetch+google+userinfo", request.url));
    }

    const { email, name, picture, email_verified: emailVerified } = googleUser;

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=Google+profile+did+not+release+email+access", request.url));
    }

    // Never trust an unverified provider email — it would allow account takeover.
    if (emailVerified === false) {
      logAuthEvent("OAUTH_GOOGLE_EMAIL_UNVERIFIED", { email });

      return NextResponse.redirect(
        new URL("/login?error=Your+Google+email+address+is+not+verified", request.url),
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 3. Find or create the user in local PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Google already verified the address, so the account starts activated.
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || normalizedEmail.split("@")[0],
          passwordHash: OAUTH_ONLY_PASSWORD_HASH,
          role: UserRole.PATIENT,
          isVerified: true,
          avatarUrl: picture || null,
        },
      });
    } else {
      // If user registered with email/password previously and is now logging in with Google,
      // append ;OAUTH flag to passwordHash if not already tracked so authProvider is recognized as BOTH.
      const updatedHash = user.passwordHash.includes("OAUTH")
        ? user.passwordHash
        : `${user.passwordHash};OAUTH`;

      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(picture ? { avatarUrl: picture } : {}),
          passwordHash: updatedHash,
          isVerified: true,
        },
      });
    }

    if (!user.isActive) {
      logAuthEvent("OAUTH_GOOGLE_LOGIN_BLOCKED_DEACTIVATED", { email: user.email });

      return NextResponse.redirect(
        new URL("/login?error=This+account+has+been+deactivated", request.url),
      );
    }

    // 4. Issue the local session cookie — set it explicitly on the redirect
    // response so it actually reaches the browser on Vercel.
    const token = await signSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    });

    logAuthEvent("OAUTH_GOOGLE_LOGIN_SUCCESS", { email: user.email, role: user.role });

    // 5. Redirect the user directly to their role dashboard
    const response = NextResponse.redirect(new URL(dashboardForRole(user.role), request.url));

    response.cookies.set(SESSION_COOKIE, token, {
      ...SESSION_COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: any) {
    logAuthEvent("OAUTH_GOOGLE_CALLBACK_EXCEPTION", { error: err?.message || String(err) });

    return NextResponse.redirect(new URL("/login?error=Unexpected+oauth+callback+error", request.url));
  }
}

