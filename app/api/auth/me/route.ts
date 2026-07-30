import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { avatarUrl: true },
    });

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        role: session.role,
        name: session.name,
        avatarUrl: dbUser?.avatarUrl ?? session.avatarUrl ?? null,
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
