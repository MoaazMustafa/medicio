import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyJwt } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("medicio_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    const payload = verifyJwt(sessionCookie.value);

    if (!payload) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      },
    });
  } catch (error: any) {
    console.error("Auth Me Verification Error: ", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during token verification." },
      { status: 500 }
    );
  }
}
