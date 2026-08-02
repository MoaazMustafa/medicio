import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import {
  sendDoctorApplicationApprovedEmail,
  sendDoctorApplicationRejectedEmail,
} from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["ADMIN", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const { doctorId, approve, action, rejectionReason } = body;

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

    const targetAction = action || (approve ? "approve" : "reject");
    let updatedDoctor = null;

    if (targetAction === "approve") {
      updatedDoctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          isVerified: true,
          verificationStatus: "APPROVED",
          rejectionReason: null,
          isReviewRequested: false,
        } as any,
      });

      if (doctor.userId) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: { isVerified: true },
        });
      }
    } else if (targetAction === "archive") {
      updatedDoctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          isVerified: false,
          verificationStatus: "ARCHIVED",
          isReviewRequested: false,
        } as any,
      });

      if (doctor.userId) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: { isVerified: false },
        });
      }
    } else {
      // Rejection: set status to REJECTED with rejectionReason
      updatedDoctor = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          isVerified: false,
          verificationStatus: "REJECTED",
          rejectionReason: rejectionReason || "Credentials failed verification audit. Please review and resubmit.",
          isReviewRequested: false,
        } as any,
      });

      if (doctor.userId) {
        await prisma.user.update({
          where: { id: doctor.userId },
          data: { isVerified: false },
        });
      }
    }

    const isApproved = targetAction === "approve";

    await writeAudit({
      action: isApproved ? "DOCTOR_VERIFIED" : targetAction === "archive" ? "DOCTOR_ARCHIVED" : "DOCTOR_REJECTED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "DOCTOR",
      entityId: doctorId,
      metadata: {
        doctorName: doctor.user?.name || "Doctor",
        doctorEmail: doctor.user?.email,
        licenseNumber: doctor.licenseNumber,
        action: targetAction,
        rejectionReason: rejectionReason || null,
      },
    });

    if (doctor.user?.email) {
      if (isApproved) {
        sendDoctorApplicationApprovedEmail(
          doctor.user.email,
          doctor.user.name || "Practitioner",
          doctor.specialty
        ).catch((err) => console.error("[email] Error sending doctor approved email:", err));
      } else if (targetAction === "reject") {
        sendDoctorApplicationRejectedEmail(
          doctor.user.email,
          doctor.user.name || "Practitioner",
          doctor.specialty,
          rejectionReason
        ).catch((err) => console.error("[email] Error sending doctor rejected email:", err));
      }
    }

    return NextResponse.json({
      message: isApproved
        ? `Credentials for ${doctor.user?.name || "Doctor"} verified successfully.`
        : targetAction === "archive"
        ? `Application for ${doctor.user?.name || "Doctor"} archived.`
        : `Verification request for ${doctor.user?.name || "Doctor"} was rejected.`,
      doctor: updatedDoctor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process verification" }, { status: 500 });
  }
}
