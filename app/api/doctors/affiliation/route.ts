import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { sendHospitalAffiliationEmail } from "@/lib/email";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, doctorId, hospitalId } = body;

    if (!action) {
      return NextResponse.json({ error: "action parameter is required" }, { status: 400 });
    }

    // 1. Doctor requests affiliation with a hospital (FR-DOC-05)
    if (action === "REQUEST_HOSPITAL") {
      const doctor = await prisma.doctor.findUnique({
        where: { userId: session.userId },
      });
      if (!doctor) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 404 });
      }
      if (!hospitalId) {
        return NextResponse.json({ error: "hospitalId is required" }, { status: 400 });
      }

      const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
      if (!hospital) {
        return NextResponse.json({ error: "Target hospital not found" }, { status: 404 });
      }

      const updated = await prisma.doctor.update({
        where: { id: doctor.id },
        data: {
          hospitalId,
          affiliationStatus: "PENDING_HOSPITAL_ACCEPT",
          affiliationRequestedBy: "DOCTOR",
        },
        include: { hospital: true },
      });

      // Notify the hospital administrator about the pending request.
      if (hospital.userId) {
        await notify({
          userId: hospital.userId,
          type: "AFFILIATION",
          title: "New affiliation request",
          body: `Dr. ${session.name || "A practitioner"} requested to affiliate with ${hospital.name}. Review and confirm the request.`,
          href: "/hospital/dashboard",
          metadata: { doctorId: doctor.id, hospitalId, status: "PENDING_HOSPITAL_ACCEPT" },
        });
      }

      return NextResponse.json({
        message: `Affiliation request sent to ${hospital.name}. Pending hospital confirmation.`,
        doctor: updated,
      });
    }

    // 2. Hospital requests doctor by doctorId (FR-DOC-05)
    if (action === "REQUEST_DOCTOR") {
      if (session.role !== "HOSPITAL_ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden. Requires Hospital Admin role." }, { status: 403 });
      }

      if (!doctorId || !hospitalId) {
        return NextResponse.json({ error: "doctorId and hospitalId are required" }, { status: 400 });
      }

      const updated = await prisma.doctor.update({
        where: { id: doctorId },
        data: {
          hospitalId,
          affiliationStatus: "PENDING_DOCTOR_ACCEPT",
          affiliationRequestedBy: "HOSPITAL",
        },
        include: { user: true, hospital: true },
      });

      // Notify the practitioner about the invitation.
      await notify({
        userId: updated.userId,
        type: "AFFILIATION",
        title: "Hospital affiliation invitation",
        body: `${updated.hospital?.name || "A hospital"} invited you to join as an affiliated practitioner. Accept or decline from your profile.`,
        href: "/doctor/profile/affiliations",
        metadata: { doctorId: updated.id, hospitalId, status: "PENDING_DOCTOR_ACCEPT" },
      });

      if (updated.user?.email) {
        const emailSent = await sendHospitalAffiliationEmail({
          recipientEmail: updated.user.email,
          recipientName: updated.user.name || "Doctor",
          hospitalName: updated.hospital?.name || "Hospital",
          doctorName: updated.user.name || "Doctor",
          status: "PENDING_DOCTOR_ACCEPT",
          actionRequestedBy: "HOSPITAL",
        });

        await writeAudit({
          action: "HOSPITAL_AFFILIATION_EMAIL_SENT",
          actorId: session.userId,
          actorRole: session.role,
          entityType: "DOCTOR",
          entityId: updated.id,
          metadata: {
            recipientEmail: updated.user.email,
            status: "PENDING_DOCTOR_ACCEPT",
            emailSent,
          },
        });
      }

      return NextResponse.json({
        message: `Affiliation invitation sent to Dr. ${updated.user.name}. Pending doctor confirmation.`,
        doctor: updated,
      });
    }

    // 3. Accept affiliation request
    if (action === "ACCEPT") {
      let targetDoctorId = doctorId;
      if (!targetDoctorId) {
        const doc = await prisma.doctor.findUnique({ where: { userId: session.userId } });
        if (doc) targetDoctorId = doc.id;
      }

      if (!targetDoctorId) {
        return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
      }

      const updated = await prisma.doctor.update({
        where: { id: targetDoctorId },
        data: {
          affiliationStatus: "AFFILIATED",
        },
        include: { hospital: true, user: true },
      });

      // Notify both sides; skip whoever performed the acceptance.
      const confirmedHospitalName = updated.hospital?.name || "the hospital";

      if (updated.userId !== session.userId) {
        await notify({
          userId: updated.userId,
          type: "AFFILIATION",
          title: "Affiliation confirmed",
          body: `Your affiliation with ${confirmedHospitalName} is now active.`,
          href: "/doctor/profile/affiliations",
          metadata: { doctorId: updated.id, status: "AFFILIATED" },
        });
      }

      if (updated.hospital?.userId && updated.hospital.userId !== session.userId) {
        await notify({
          userId: updated.hospital.userId,
          type: "AFFILIATION",
          title: "Affiliation confirmed",
          body: `Dr. ${updated.user?.name || "A practitioner"} is now affiliated with ${confirmedHospitalName}.`,
          href: "/hospital/dashboard",
          metadata: { doctorId: updated.id, status: "AFFILIATED" },
        });
      }

      if (updated.user?.email) {
        const emailSent = await sendHospitalAffiliationEmail({
          recipientEmail: updated.user.email,
          recipientName: updated.user.name || "Doctor",
          hospitalName: updated.hospital?.name || "Hospital",
          doctorName: updated.user.name || "Doctor",
          status: "AFFILIATED",
        });

        await writeAudit({
          action: "HOSPITAL_AFFILIATION_EMAIL_SENT",
          actorId: session.userId,
          actorRole: session.role,
          entityType: "DOCTOR",
          entityId: updated.id,
          metadata: {
            recipientEmail: updated.user.email,
            status: "AFFILIATED",
            emailSent,
          },
        });
      }

      return NextResponse.json({
        message: `Hospital affiliation confirmed with ${updated.hospital?.name || "Hospital"}.`,
        doctor: updated,
      });
    }

    // 4. Reject or Terminate affiliation request
    if (action === "REJECT" || action === "TERMINATE") {
      let targetDoctorId = doctorId;
      if (!targetDoctorId) {
        const doc = await prisma.doctor.findUnique({ where: { userId: session.userId } });
        if (doc) targetDoctorId = doc.id;
      }

      if (!targetDoctorId) {
        return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
      }

      // Snapshot the relationship before it is severed so the counterpart
      // can still be notified about who ended it.
      const before = await prisma.doctor.findUnique({
        where: { id: targetDoctorId },
        include: { hospital: true, user: { select: { id: true, name: true } } },
      });

      const updated = await prisma.doctor.update({
        where: { id: targetDoctorId },
        data: {
          hospitalId: null,
          affiliationStatus: "INDEPENDENT",
          affiliationRequestedBy: null,
        },
      });

      if (before) {
        const isRejection = action === "REJECT";
        const hospitalName = before.hospital?.name || "the hospital";
        const doctorName = before.user?.name || "the practitioner";
        const actorIsDoctor = before.userId === session.userId;

        if (!actorIsDoctor) {
          await notify({
            userId: before.userId,
            type: "AFFILIATION",
            title: isRejection ? "Affiliation request declined" : "Affiliation terminated",
            body: isRejection
              ? `${hospitalName} declined the affiliation request. You remain listed as an independent practitioner.`
              : `Your affiliation with ${hospitalName} was terminated. You are now listed as an independent practitioner.`,
            href: "/doctor/profile/affiliations",
            metadata: { doctorId: before.id, action },
          });
        } else if (before.hospital?.userId) {
          await notify({
            userId: before.hospital.userId,
            type: "AFFILIATION",
            title: isRejection ? "Affiliation invitation declined" : "Affiliation terminated",
            body: isRejection
              ? `Dr. ${doctorName} declined the affiliation invitation from ${hospitalName}.`
              : `Dr. ${doctorName} ended the affiliation with ${hospitalName}.`,
            href: "/hospital/dashboard",
            metadata: { doctorId: before.id, action },
          });
        }
      }

      return NextResponse.json({
        message: action === "REJECT" ? "Affiliation request rejected." : "Hospital affiliation terminated.",
        doctor: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process affiliation request" }, { status: 500 });
  }
}
