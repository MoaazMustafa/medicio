import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logAuthEvent } from "@/lib/logger";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("medicio_session");
    
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
