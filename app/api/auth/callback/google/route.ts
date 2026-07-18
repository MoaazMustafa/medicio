import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { signJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/chatbot",
  DOCTOR: "/doctor/dashboard",
  PHARMACY_ADMIN: "/pharmacy/dashboard",
  LAB_ADMIN: "/lab/dashboard",
  HOSPITAL_ADMIN: "/hospital/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Google OAuth error parameter:", error);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL("/login?error=Missing+oauth+authorization+code", request.url));
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("Missing Google OAuth credentials in environmental variables.");
      return NextResponse.redirect(new URL("/login?error=Google+OAuth+is+not+configured+on+server", request.url));
    }

    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Google token exchange error:", tokens);
      return NextResponse.redirect(new URL("/login?error=Failed+to+exchange+google+tokens", request.url));
    }

    // 2. Query user profile info from Google API
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userinfoResponse.json();

    if (!userinfoResponse.ok) {
      console.error("Google userinfo query error:", googleUser);
      return NextResponse.redirect(new URL("/login?error=Failed+to+fetch+google+userinfo", request.url));
    }

    const { email, name, sub } = googleUser;

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=Google+profile+did+not+release+email+access", request.url));
    }

    // 3. Find or create the user in local PostgreSQL
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user (defaults to PATIENT, isVerified: true since Google verified their email!)
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          passwordHash: `OAUTH_GOOGLE_${sub}_${Math.random().toString(36).slice(-8)}`, // placeholder hash
          role: UserRole.PATIENT,
          isVerified: true,
        },
      });
    }

    // 4. Issue the local session JWT cookie
    const localToken = signJwt({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const cookieStore = await cookies();
    cookieStore.set("medicio_session", localToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // 5. Redirect the user directly to their role dashboard
    const targetDashboard = ROLE_DASHBOARDS[user.role] || "/";
    return NextResponse.redirect(new URL(targetDashboard, request.url));
  } catch (err: any) {
    console.error("Google OAuth callback exception:", err);
    return NextResponse.redirect(new URL("/login?error=Unexpected+oauth+callback+error", request.url));
  }
}
