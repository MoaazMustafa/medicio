import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/medicine-tracker/reminders
 * Returns all active dose reminders for the authenticated patient,
 * along with a calculated list of today's scheduled doses.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const entries = await prisma.medicineTrackerEntry.findMany({
      where: {
        userId: session.userId,
        isReminderEnabled: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    const scheduledDoses: Array<{
      entryId: string;
      medicineName: string;
      dosage: string;
      time: string;
      isDueNow: boolean;
    }> = [];

    for (const entry of entries) {
      if (!entry.reminderTimes) continue;
      try {
        const times: string[] = JSON.parse(entry.reminderTimes);
        for (const t of times) {
          // A dose is due if within a 15-minute window of the reminder time
          const [hStr, mStr] = t.split(":");
          const h = parseInt(hStr, 10);
          const m = parseInt(mStr, 10);
          const timeDiffMinutes = Math.abs((currentHour * 60 + currentMinute) - (h * 60 + m));

          scheduledDoses.push({
            entryId: entry.id,
            medicineName: entry.medicineName,
            dosage: entry.dosage,
            time: t,
            isDueNow: timeDiffMinutes <= 15,
          });
        }
      } catch {
        // Ignore parsing errors for custom string formats
      }
    }

    // Sort by time
    scheduledDoses.sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({
      activeMedicationsCount: entries.length,
      currentTime: currentTimeString,
      scheduledDoses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch dose reminders" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/medicine-tracker/reminders
 * Trigger a dose reminder notification for a specific medicine entry.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entryId, doseTime } = body;

    if (!entryId) {
      return NextResponse.json({ error: "entryId is required" }, { status: 400 });
    }

    const entry = await prisma.medicineTrackerEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.userId !== session.userId) {
      return NextResponse.json({ error: "Medicine entry not found" }, { status: 404 });
    }

    // Dispatch via in-app notification & Web Push
    await notify({
      userId: session.userId,
      type: "MEDICINE",
      title: `Prescription Reminder: ${entry.medicineName}`,
      body: `It's time to take your scheduled dose of ${entry.medicineName} (${entry.dosage})${doseTime ? ` for ${doseTime}` : ""}.`,
      href: "/medicines",
      metadata: {
        entryId: entry.id,
        medicineName: entry.medicineName,
        dosage: entry.dosage,
        time: doseTime,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Dose reminder sent for ${entry.medicineName}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger reminder notification" },
      { status: 500 },
    );
  }
}
