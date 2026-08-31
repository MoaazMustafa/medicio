import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  computeIsTrained,
  ensureSpecialistAgents,
  getAttachedDoctorIds,
  parseJsonStringArray,
  SPECIALIST_DEFS,
} from "@/lib/specialist-agents";

/**
 * GET /api/agents — specialist AI model catalog for the patient chatbot.
 * Returns availability (trained/enabled) and suggested questions per model.
 * Never exposes raw training data to patients.
 */
export async function GET() {
  try {
    await ensureSpecialistAgents(prisma);

    const agents = await prisma.specialistAgent.findMany();

    // Resolve every attached doctor across all agents in one query.
    const allDoctorIds = [...new Set(agents.flatMap((agent) => getAttachedDoctorIds(agent)))];
    const doctors = allDoctorIds.length
      ? await prisma.doctor.findMany({
          where: { id: { in: allDoctorIds } },
          select: { id: true, aiTrainingData: true, user: { select: { name: true } } },
        })
      : [];
    const doctorById = new Map(doctors.map((d) => [d.id, d]));

    const defOrder = new Map(SPECIALIST_DEFS.map((def, i) => [def.specialty, i]));

    const formatted = agents
      .sort(
        (a, b) =>
          (defOrder.get(a.specialty) ?? SPECIALIST_DEFS.length) -
          (defOrder.get(b.specialty) ?? SPECIALIST_DEFS.length),
      )
      .map((agent) => {
        const attachedDoctors = getAttachedDoctorIds(agent)
          .map((id) => doctorById.get(id))
          .filter((d): d is NonNullable<typeof d> => Boolean(d));

        return {
          specialty: agent.specialty,
          displayName: agent.displayName,
          description: agent.description,
          isEnabled: agent.isEnabled,
          isTrained: computeIsTrained(agent, attachedDoctors),
          suggestedQuestions: parseJsonStringArray(agent.suggestedQuestions),
          attachedDoctorCount: attachedDoctors.length,
        };
      });

    return NextResponse.json({ agents: formatted });
  } catch (error: any) {
    console.error("Agents list error: ", error);

    return NextResponse.json({ error: "Failed to load specialist models." }, { status: 500 });
  }
}
