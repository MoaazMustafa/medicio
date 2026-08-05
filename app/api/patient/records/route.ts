import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/patient/records
 * Returns a consolidated snapshot of a patient's health records:
 *   - Lab reports
 *   - Appointments (all statuses)
 *   - Medicine tracker entries
 *   - AI conversation history summaries
 *
 * Access is restricted to the authenticated patient's own data.
 * Super Admin may query any patient's records via ?patientId=<id>.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedPatientId = searchParams.get("patientId");

    // Determine which patient's records to return
    let targetUserId: string;
    if (requestedPatientId && (session.role === "SUPER_ADMIN" || session.role === "ADMIN")) {
      targetUserId = requestedPatientId;
    } else {
      // All other roles can only access their own records
      targetUserId = session.userId;
    }

    // Parallel fetch of all record types
    const [labReports, appointments, medicineEntries, aiConversations] = await Promise.all([
      // Lab reports linked to this patient
      prisma.labReport.findMany({
        where: { patientId: targetUserId },
        include: {
          lab: { select: { id: true, name: true, isVerified: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // All appointments
      prisma.appointment.findMany({
        where: { patientId: targetUserId },
        include: {
          doctor: {
            include: {
              user: { select: { name: true, email: true, avatarUrl: true } },
              hospital: { select: { name: true, location: true } },
            },
          },
        },
        orderBy: { dateTime: "desc" },
      }),

      // Medicine tracker entries
      prisma.medicineTrackerEntry.findMany({
        where: { userId: targetUserId },
        orderBy: { startDate: "desc" },
      }),

      // AI conversation summaries (messages parsed for first user message as symptom prompt)
      prisma.aIConversation.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          conversationType: true,
          title: true,
          messages: true,
          createdAt: true,
        },
      }),
    ]);

    // Transform AI conversations: extract first user message, severity, specialty from last triage result
    const aiSummaries = aiConversations.map((conv) => {
      let symptomPrompt = conv.title || "Triage session";
      let severityLevel: string | null = null;
      let suggestedSpecialty: string | null = null;
      let summary: string | null = null;
      let messageCount = 0;

      try {
        const msgs: any[] = JSON.parse(conv.messages);
        messageCount = msgs.length;

        const firstUser = msgs.find((m) => m.role === "user");
        if (firstUser) symptomPrompt = firstUser.content || symptomPrompt;

        // Walk backwards to find the last triage result
        for (let i = msgs.length - 1; i >= 0; i--) {
          const msg = msgs[i];
          if (msg.triageResult) {
            severityLevel = msg.triageResult.severityLevel ?? null;
            suggestedSpecialty = msg.triageResult.suggestedSpecialty ?? null;
            summary = msg.triageResult.summary ?? null;
            break;
          }
        }
      } catch {
        // messages is not valid JSON — treat gracefully
      }

      return {
        id: conv.id,
        conversationType: conv.conversationType,
        title: conv.title,
        symptomPrompt,
        severityLevel,
        suggestedSpecialty,
        summary,
        messageCount,
        createdAt: conv.createdAt,
      };
    });

    return NextResponse.json({
      labReports: labReports.map((r) => ({
        id: r.id,
        testName: r.testName,
        resultData: r.resultData,
        fileUrl: r.fileUrl,
        labName: r.lab?.name || "Diagnostic Lab",
        labId: r.lab?.id || r.labId,
        isVerified: r.lab?.isVerified ?? false,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      appointments: appointments.map((a) => ({
        id: a.id,
        dateTime: a.dateTime,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt,
        doctorName: a.doctor?.user?.name || "Doctor",
        doctorSpecialty: a.doctor?.specialty || "General Practice",
        doctorExperience: a.doctor?.experience || 0,
        clinicAddress: a.doctor?.clinicAddress || "",
        consultationFee: a.doctor?.consultationFee || 0,
        hospitalName: a.doctor?.hospital?.name || "",
        hospitalLocation: a.doctor?.hospital?.location || "",
      })),
      medicines: medicineEntries,
      aiSessions: aiSummaries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch health records" },
      { status: 500 },
    );
  }
}
