import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadStr = parts[1];
    let base64 = payloadStr.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    // Edge runtime supports atob
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

// Map user roles to their respective landing dashboards
const ROLE_DASHBOARDS: Record<string, string> = {
  PATIENT: "/chatbot",
  DOCTOR: "/doctor/dashboard",
  PHARMACY_ADMIN: "/pharmacy/dashboard",
  LAB_ADMIN: "/lab/dashboard",
  HOSPITAL_ADMIN: "/hospital/dashboard",
  ADMIN: "/admin/dashboard",
  SUPER_ADMIN: "/admin/dashboard",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("medicio_session");
  const token = sessionCookie?.value;

  const payload = token ? decodeJwtPayload(token) : null;
  const isLoggedIn = !!payload;
  const userRole = payload?.role;

  // 1. Handle Guest Pages (/login, /register, /forgot-password, /verify-email)
  const isAuthPage = 
    pathname === "/login" || 
    pathname === "/register" || 
    pathname === "/forgot-password" || 
    pathname === "/verify-email";
  if (isAuthPage) {
    if (isLoggedIn && userRole) {
      const targetDashboard = ROLE_DASHBOARDS[userRole] || "/";
      return NextResponse.redirect(new URL(targetDashboard, request.url));
    }
    return NextResponse.next();
  }

  // 2. Handle Protected Dashboard Routes
  const dashboardRoutes = [
    { prefix: "/chatbot", allowedRoles: ["PATIENT", "ADMIN", "SUPER_ADMIN"] },
    { prefix: "/admin/dashboard", allowedRoles: ["ADMIN", "SUPER_ADMIN"] },
    { prefix: "/doctor/dashboard", allowedRoles: ["DOCTOR"] },
    { prefix: "/pharmacy/dashboard", allowedRoles: ["PHARMACY_ADMIN"] },
    { prefix: "/lab/dashboard", allowedRoles: ["LAB_ADMIN"] },
    { prefix: "/hospital/dashboard", allowedRoles: ["HOSPITAL_ADMIN"] },
  ];

  const matchedRoute = dashboardRoutes.find((r) => pathname.startsWith(r.prefix));

  if (matchedRoute) {
    // If not logged in, force authentication login screen
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If logged in but does not hold correct permissions, redirect to their own correct role portal page
    if (userRole && !matchedRoute.allowedRoles.includes(userRole)) {
      const correctDashboard = ROLE_DASHBOARDS[userRole] || "/";
      return NextResponse.redirect(new URL(correctDashboard, request.url));
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
    "/admin/dashboard/:path*",
    "/doctor/dashboard/:path*",
    "/pharmacy/dashboard/:path*",
    "/lab/dashboard/:path*",
    "/hospital/dashboard/:path*",
  ],
};
