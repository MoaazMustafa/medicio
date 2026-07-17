import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("medicio_session");
    
    return NextResponse.json({
      success: true,
      message: "Session cleared successfully.",
    });
  } catch (error: any) {
    console.error("Logout Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during logout." },
      { status: 500 }
    );
  }
}
