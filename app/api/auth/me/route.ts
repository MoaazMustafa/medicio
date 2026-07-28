import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        name: session.name,
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
