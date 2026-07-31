import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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

      const updated = await prisma.doctor.update({
        where: { id: targetDoctorId },
        data: {
          hospitalId: null,
          affiliationStatus: "INDEPENDENT",
          affiliationRequestedBy: null,
        },
      });

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
