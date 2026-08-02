import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE);
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true, avatarUrl: true },
    });

    if (!dbUser || !dbUser.isActive || dbUser.role !== session.role) {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE);
      const res = NextResponse.json(
        { user: null, error: "Your account role has changed or account was deactivated. Please sign in again." },
        { status: 401 }
      );
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name: dbUser.name,
        avatarUrl: dbUser.avatarUrl ?? session.avatarUrl ?? null,
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
