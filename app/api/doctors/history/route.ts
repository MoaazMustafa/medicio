import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(["DOCTOR", "ADMIN", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const session = auth.session;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
    });

    if (!doctor) {
      return NextResponse.json({ histories: [] });
    }

    const histories = await (prisma as any).doctorApplicationHistory.findMany({
      where: { doctorId: doctor.id },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ histories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch application history" }, { status: 500 });
  }
}
