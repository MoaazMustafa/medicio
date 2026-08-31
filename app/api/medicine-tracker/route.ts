import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medicine-tracker
 * Returns all medicine tracker entries for the authenticated patient.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const entries = await prisma.medicineTrackerEntry.findMany({
      where: { userId: session.userId },
      orderBy: { startDate: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch medicine entries" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/medicine-tracker
 * Create a new medicine tracker entry for the authenticated patient.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      medicineName,
      dosage,
      frequency,
      startDate,
      endDate,
      reminderTimes,
      isReminderEnabled,
    } = body;

    if (!medicineName || !dosage || !frequency || !startDate) {
      return NextResponse.json(
        { error: "medicineName, dosage, frequency, and startDate are required" },
        { status: 400 },
      );
    }

    const reminderTimesString = Array.isArray(reminderTimes)
      ? JSON.stringify(reminderTimes)
      : typeof reminderTimes === "string"
      ? reminderTimes
      : null;

    const entry = await prisma.medicineTrackerEntry.create({
      data: {
        userId: session.userId,
        medicineName: medicineName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        reminderTimes: reminderTimesString,
        isReminderEnabled: Boolean(isReminderEnabled),
      },
    });

    await writeAudit({
      action: "MEDICINE_ENTRY_CREATED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "MedicineTrackerEntry",
      entityId: entry.id,
      metadata: { medicineName: entry.medicineName, dosage: entry.dosage },
    });

    return NextResponse.json({ message: "Medicine entry added.", entry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create medicine entry" },
      { status: 500 },
    );
  }
}
