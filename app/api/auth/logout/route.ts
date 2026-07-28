import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";
import { logAuthEvent } from "@/lib/logger";

export async function POST() {
  try {
    await clearSessionCookie();

    logAuthEvent("USER_LOGOUT_SUCCESS", {});

    return NextResponse.json({
      success: true,
      message: "Session cleared successfully.",
    });
  } catch (error: any) {
    logAuthEvent("USER_LOGOUT_EXCEPTION", { error: error.message || error });
    console.error("Logout Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
