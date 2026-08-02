import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId } = await params;
    const body = await request.json();
    const { status, dateTime, notes } = body;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Auth check: Doctor, Patient involved, or Admin
    const isDoctorOwner = existingAppointment.doctor.userId === session.userId;
    const isPatientOwner = existingAppointment.patientId === session.userId;
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN";

    if (!isDoctorOwner && !isPatientOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status; // PENDING, CONFIRMED, RESCHEDULED, CANCELLED, COMPLETED
    if (dateTime) updateData.dateTime = new Date(dateTime);
    if (notes !== undefined) updateData.notes = notes;

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: {
          select: { name: true, email: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    await writeAudit({
      action: "DOCTOR_APPOINTMENT_STATUS_UPDATED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "APPOINTMENT",
      entityId: appointmentId,
      ip: getClientIp(request),
      metadata: {
        appointmentId,
        status: updatedAppointment.status,
        patientName: updatedAppointment.patient?.name,
        patientEmail: updatedAppointment.patient?.email,
        doctorName: updatedAppointment.doctor?.user?.name,
        doctorSpecialty: updatedAppointment.doctor?.specialty,
      },
    });

    return NextResponse.json({
      message: `Appointment updated to status: ${updatedAppointment.status}.`,
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update appointment" }, { status: 500 });
  }
}
