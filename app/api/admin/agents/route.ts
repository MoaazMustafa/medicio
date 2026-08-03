import { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import {
  computeIsTrained,
  ensureSpecialistAgents,
  getAttachedDoctorIds,
  parseDoctorTraining,
  parseJsonStringArray,
  SPECIALIST_DEFS,
} from "@/lib/specialist-agents";

const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN] as const;

/**
 * GET /api/admin/agents — full specialist model catalog for administration:
 * training data, suggested questions, attached doctors, plus every doctor
 * that can be attached as a training source.
 */
export async function GET() {
  const { response } = await requireRole(ADMIN_ROLES);

  if (response) return response;

  try {
    await ensureSpecialistAgents(prisma);

    const [agents, doctors] = await Promise.all([
      prisma.specialistAgent.findMany(),
      prisma.doctor.findMany({
        select: {
          id: true,
          specialty: true,
          verificationStatus: true,
          aiTrainingData: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const doctorById = new Map(doctors.map((d) => [d.id, d]));

    const formattedDoctors = doctors.map((doc) => {
      const training = parseDoctorTraining(doc.aiTrainingData);

      return {
        id: doc.id,
        name: doc.user?.name ?? "Unnamed Doctor",
        email: doc.user?.email ?? null,
        specialty: doc.specialty,
        verificationStatus: doc.verificationStatus,
        isTrained: training?.isTrained === true,
        agentName: training?.agentName ?? null,
        training: training
          ? {
              agentName: training.agentName ?? "",
              agentTone: training.agentTone ?? "",
              emergencyRedFlags: training.emergencyRedFlags ?? [],
              intakeProtocols: training.intakeProtocols ?? "",
              practiceBoundaries: training.practiceBoundaries ?? "",
              customDisclaimer: training.customDisclaimer ?? "",
              triageAdviceRules: training.triageAdviceRules ?? "",
              trainedAt: training.trainedAt ?? null,
            }
          : null,
      };
    });

    const defOrder = new Map(SPECIALIST_DEFS.map((def, i) => [def.specialty, i]));

    const formattedAgents = agents
      .sort(
        (a, b) =>
          (defOrder.get(a.specialty) ?? SPECIALIST_DEFS.length) -
          (defOrder.get(b.specialty) ?? SPECIALIST_DEFS.length),
      )
      .map((agent) => {
        const attachedIds = getAttachedDoctorIds(agent);
        const attachedDoctors = attachedIds
          .map((id) => doctorById.get(id))
          .filter((d): d is NonNullable<typeof d> => Boolean(d));

        return {
          id: agent.id,
          specialty: agent.specialty,
          displayName: agent.displayName,
          description: agent.description,
          trainingData: agent.trainingData,
          suggestedQuestions: parseJsonStringArray(agent.suggestedQuestions),
          attachedDoctorIds: attachedIds,
          isEnabled: agent.isEnabled,
          isTrained: computeIsTrained(agent, attachedDoctors),
          updatedAt: agent.updatedAt,
        };
      });

    return NextResponse.json({ agents: formattedAgents, doctors: formattedDoctors });
  } catch (error: any) {
    console.error("Admin agents list error: ", error);

    return NextResponse.json({ error: "Failed to load specialist models." }, { status: 500 });
  }
}
