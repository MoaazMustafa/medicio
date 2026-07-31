import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorize";
import { writeAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["DOCTOR", "ADMIN", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const session = auth.session;

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
      include: { user: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      emergencyRedFlags,
      intakeProtocols,
      practiceBoundaries,
      customDisclaimer,
      triageAdviceRules,
      agentName,
      agentTone,
    } = body;

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save AI training responses" }, { status: 500 });
  }
}
