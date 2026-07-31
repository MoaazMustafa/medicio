import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { logAuthEvent } from "@/lib/logger";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function POST() {
  try {
    await clearSessionCookie();

    logAuthEvent("USER_LOGOUT_SUCCESS", {});

    const response = NextResponse.json({
      success: true,
      message: "Session cleared successfully.",
    });

    response.cookies.delete(SESSION_COOKIE);

    return response;
  } catch (error: any) {
    logAuthEvent("USER_LOGOUT_EXCEPTION", { error: error.message || error });
    console.error("Logout Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
