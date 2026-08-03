import { UserRole } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { computeIsTrained, getAttachedDoctorIds, parseJsonStringArray } from "@/lib/specialist-agents";
import { updateSpecialistAgentSchema } from "@/lib/validations/admin";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * PATCH /api/admin/agents/[agentId] — update a specialist AI model:
 * display info, training data, suggested questions, attached doctors,
 * and enabled state.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { session, response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    const { agentId } = await params;
    const body = await request.json();
    const result = updateSpecialistAgentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const agent = await prisma.specialistAgent.findUnique({ where: { id: agentId } });

    if (!agent) {
      return NextResponse.json({ error: "Specialist model not found." }, { status: 404 });
    }

    const { displayName, description, trainingData, suggestedQuestions, attachedDoctorIds, isEnabled } =
      result.data;

    // Keep only doctor ids that actually exist.
    let validatedDoctorIds: string[] | undefined;

    if (attachedDoctorIds !== undefined) {
      const existing = await prisma.doctor.findMany({
        where: { id: { in: attachedDoctorIds } },
        select: { id: true },
      });
      const existingSet = new Set(existing.map((d) => d.id));

      validatedDoctorIds = attachedDoctorIds.filter((id) => existingSet.has(id));
    }

    const updated = await prisma.specialistAgent.update({
      where: { id: agent.id },
      data: {
        ...(displayName !== undefined ? { displayName } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(trainingData !== undefined ? { trainingData: trainingData?.trim() ? trainingData.trim() : null } : {}),
        ...(suggestedQuestions !== undefined
          ? { suggestedQuestions: JSON.stringify(suggestedQuestions.map((q) => q.trim()).filter(Boolean)) }
          : {}),
        ...(validatedDoctorIds !== undefined ? { attachedDoctorIds: JSON.stringify(validatedDoctorIds) } : {}),
        ...(isEnabled !== undefined ? { isEnabled } : {}),
      },
    });

    const attachedDoctors = getAttachedDoctorIds(updated).length
      ? await prisma.doctor.findMany({
          where: { id: { in: getAttachedDoctorIds(updated) } },
          select: { id: true, aiTrainingData: true, user: { select: { name: true } } },
        })
      : [];

    await writeAudit({
      action: "AI_SPECIALIST_AGENT_UPDATED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "SPECIALIST_AGENT",
      entityId: updated.id,
      metadata: {
        specialty: updated.specialty,
        updatedFields: Object.keys(result.data).filter(
          (key) => result.data[key as keyof typeof result.data] !== undefined,
        ),
      },
    });

    return NextResponse.json({
      agent: {
        id: updated.id,
        specialty: updated.specialty,
        displayName: updated.displayName,
        description: updated.description,
        trainingData: updated.trainingData,
        suggestedQuestions: parseJsonStringArray(updated.suggestedQuestions),
        attachedDoctorIds: getAttachedDoctorIds(updated),
        isEnabled: updated.isEnabled,
        isTrained: computeIsTrained(updated, attachedDoctors),
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Admin agent update error: ", error);

    return NextResponse.json({ error: "Failed to update specialist model." }, { status: 500 });
  }
}
