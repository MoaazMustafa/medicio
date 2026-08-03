import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { parseDoctorTraining } from "@/lib/specialist-agents";
import { adminDoctorTrainingSchema } from "@/lib/validations/admin";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * PATCH /api/admin/agents/doctors/[doctorId] — admin-managed training data
 * for any doctor's personal AI agent (same shape as the doctor's own
 * /api/agents/train flow). Merges over any existing training values.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const { doctorId } = await params;
    const body = await request.json();
    const result = adminDoctorTrainingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: { select: { name: true } } },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
    }

    const existing = parseDoctorTraining(doctor.aiTrainingData) ?? {};
    const input = result.data;

    const aiTrainingObject = {
      agentName:
        input.agentName ?? existing.agentName ?? `Dr. ${doctor.user?.name ?? "Unknown"}'s Specialty Agent`,
      agentTone: input.agentTone ?? existing.agentTone ?? "Empathetic & Clinical",
      specialty: doctor.specialty,
      emergencyRedFlags: input.emergencyRedFlags ?? existing.emergencyRedFlags ?? [],
      intakeProtocols: input.intakeProtocols ?? existing.intakeProtocols ?? "",
      practiceBoundaries: input.practiceBoundaries ?? existing.practiceBoundaries ?? "",
      customDisclaimer:
        input.customDisclaimer ??
        existing.customDisclaimer ??
        "AI advisory only. Seek immediate ER care for life-threatening emergencies.",
      triageAdviceRules: input.triageAdviceRules ?? existing.triageAdviceRules ?? "",
      trainedAt: new Date().toISOString(),
      isTrained: input.isTrained ?? true,
    };

    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { aiTrainingData: JSON.stringify(aiTrainingObject) },
    });

    await writeAudit({
      action: "AI_DOCTOR_TRAINING_UPDATED_BY_ADMIN",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "DOCTOR_AI_AGENT",
      entityId: doctor.id,
      metadata: {
        specialty: doctor.specialty,
        agentName: aiTrainingObject.agentName,
        isTrained: aiTrainingObject.isTrained,
      },
    });

    return NextResponse.json({
      message: "Doctor AI training updated.",
      doctor: {
        id: doctor.id,
        name: doctor.user?.name ?? "Unnamed Doctor",
        specialty: doctor.specialty,
        isTrained: aiTrainingObject.isTrained,
        agentName: aiTrainingObject.agentName,
        training: {
          agentName: aiTrainingObject.agentName,
          agentTone: aiTrainingObject.agentTone,
          emergencyRedFlags: aiTrainingObject.emergencyRedFlags,
          intakeProtocols: aiTrainingObject.intakeProtocols,
          practiceBoundaries: aiTrainingObject.practiceBoundaries,
          customDisclaimer: aiTrainingObject.customDisclaimer,
          triageAdviceRules: aiTrainingObject.triageAdviceRules,
          trainedAt: aiTrainingObject.trainedAt,
        },
      },
    });
  } catch (error: any) {
    console.error("Admin doctor training error: ", error);

    return NextResponse.json({ error: "Failed to update doctor training." }, { status: 500 });
  }
}
