import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  GUEST_ROUTES,
  PROTECTED_ROUTES,
  dashboardForRole,
} from "@/config/roles";
import { verifyJwt } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // The signature is verified here — an attacker-supplied cookie payload is never trusted.
  const session = token ? await verifyJwt(token) : null;
  const userRole = session?.role;

  // 1. Guest-only pages (/login, /register, /forgot-password, /verify-email)
  if (GUEST_ROUTES.some((route) => route === pathname)) {
    if (session) {
      return NextResponse.redirect(new URL(dashboardForRole(userRole), request.url));
    }

    return NextResponse.next();
  }

  // 2. Role-gated dashboard routes
  const matchedRoute = PROTECTED_ROUTES.find((route) =>
    pathname.startsWith(route.prefix),
  );

  if (matchedRoute) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);

      loginUrl.searchParams.set("redirectTo", pathname);

      const response = NextResponse.redirect(loginUrl);

      // Drop expired or tampered cookies so the client stops resending them.
      if (token) response.cookies.delete(SESSION_COOKIE);

      return response;
    }

    if (!matchedRoute.allowedRoles.includes(userRole as string)) {
      return NextResponse.redirect(new URL(dashboardForRole(userRole), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email",
    "/chatbot/:path*",
    "/settings/:path*",
    "/admin/dashboard/:path*",
    "/doctor/dashboard/:path*",
    "/pharmacy/dashboard/:path*",
    "/lab/dashboard/:path*",
    "/hospital/dashboard/:path*",
  ],
};
