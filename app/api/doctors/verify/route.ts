import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorize";
import { writeAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { doctorId, approve, rejectionReason } = body;

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
    }

    const isVerified = Boolean(approve);

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctorId },
      data: { isVerified },
    });

    if (doctor.userId) {
      await prisma.user.update({
        where: { id: doctor.userId },
        data: { isVerified },
      });
    }

    await writeAudit({
      action: isVerified ? "DOCTOR_VERIFIED" : "DOCTOR_REJECTED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "DOCTOR",
      entityId: doctorId,
      metadata: {
        doctorName: doctor.user.name,
        doctorEmail: doctor.user.email,
        licenseNumber: doctor.licenseNumber,
        rejectionReason: rejectionReason || null,
      },
    });

    return NextResponse.json({
      message: isVerified
        ? `Credentials for ${doctor.user.name} verified successfully.`
        : `Verification for ${doctor.user.name} was rejected.`,
      doctor: updatedDoctor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process verification" }, { status: 500 });
  }
}
