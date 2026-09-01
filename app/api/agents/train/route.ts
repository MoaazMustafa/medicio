import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["DOCTOR", "ADMIN", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const {
      specialty: bodySpecialty,
      emergencyRedFlags,
      intakeProtocols,
      practiceBoundaries,
      customDisclaimer,
      triageAdviceRules,
      agentName,
      agentTone,
    } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    });

    if (!doctor && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    if (doctor) {
      const aiTrainingObject = {
        agentName: agentName || `Dr. ${doctor.user.name}'s Specialty Agent`,
        agentTone: agentTone || "Empathetic & Clinical",
        specialty: doctor.specialty,
        emergencyRedFlags: emergencyRedFlags || [],
        intakeProtocols: intakeProtocols || "",
        practiceBoundaries: practiceBoundaries || "",
        customDisclaimer: customDisclaimer || "AI advisory only. Seek immediate ER care for life-threatening emergencies.",
        triageAdviceRules: triageAdviceRules || "",
        trainedAt: new Date().toISOString(),
        isTrained: true,
      };

      const updatedDoctor = await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          aiTrainingData: JSON.stringify(aiTrainingObject),
        },
      });

      await writeAudit({
        action: "AI_AGENT_TRAINED",
        actorId: session.userId,
        actorRole: session.role,
        entityType: "DOCTOR_AI_AGENT",
        entityId: doctor.id,
        metadata: {
          specialty: doctor.specialty,
          agentName: aiTrainingObject.agentName,
        },
      });

      return NextResponse.json({
        message: "Personal Specialty AI Agent trained and published successfully!",
        aiTrainingData: aiTrainingObject,
        doctor: updatedDoctor,
      });
    }

    // Admin direct agent training pathway
    const targetSpecialty = (bodySpecialty || "GENERAL").toUpperCase();
    const agent = await prisma.specialistAgent.findUnique({
      where: { specialty: targetSpecialty },
    });

    if (!agent) {
      return NextResponse.json({ error: `Specialist agent for ${targetSpecialty} not found` }, { status: 404 });
    }

    const trainingText = [
      `Agent: ${agentName || agent.displayName}`,
      `Tone: ${agentTone || "Empathetic & Clinical"}`,
      emergencyRedFlags?.length ? `Emergency red flags: ${emergencyRedFlags.join("; ")}` : "",
      intakeProtocols ? `Intake protocols: ${intakeProtocols}` : "",
      practiceBoundaries ? `Practice boundaries: ${practiceBoundaries}` : "",
      triageAdviceRules ? `Triage advice rules: ${triageAdviceRules}` : "",
      customDisclaimer ? `Disclaimer: ${customDisclaimer}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const updatedAgent = await prisma.specialistAgent.update({
      where: { id: agent.id },
      data: {
        trainingData: trainingText,
        displayName: agentName || agent.displayName,
      },
    });

    await writeAudit({
      action: "ADMIN_SPECIALIST_AGENT_TRAINED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "SpecialistAgent",
      entityId: agent.id,
      metadata: {
        specialty: targetSpecialty,
        agentName: updatedAgent.displayName,
      },
    });

    return NextResponse.json({
      message: `Specialist AI Agent (${targetSpecialty}) trained and published successfully!`,
      agent: updatedAgent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save AI training responses" }, { status: 500 });
  }
}
