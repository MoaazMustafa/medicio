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

    let updatedDoctor = null;

    if (isVerified) {
      updatedDoctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: { isVerified: true },
      });

      if (doctor.userId) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: { isVerified: true },
        });
      }
    } else {
      // Rejection: unverify user and delete doctor application record so doctor can resubmit
      if (doctor.userId) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: { isVerified: false },
        });
      }

      await prisma.doctor.delete({
        where: { id: doctorId },
      });
    }

    await writeAudit({
      action: isVerified ? "DOCTOR_VERIFIED" : "DOCTOR_REJECTED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "DOCTOR",
      entityId: doctorId,
      metadata: {
        doctorName: doctor.user?.name || "Doctor",
        doctorEmail: doctor.user?.email,
        licenseNumber: doctor.licenseNumber,
        rejectionReason: rejectionReason || null,
      },
    });

    return NextResponse.json({
      message: isVerified
        ? `Credentials for ${doctor.user?.name || "Doctor"} verified successfully.`
        : `Verification request for ${doctor.user?.name || "Doctor"} was rejected.`,
      doctor: updatedDoctor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process verification" }, { status: 500 });
  }
}
