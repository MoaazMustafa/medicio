import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { sendAppointmentStatusEmail } from "@/lib/email";
import { notifyMany } from "@/lib/notifications";
import type { NotifyInput } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

const APPOINTMENT_STATUS_TITLES: Record<string, string> = {
  CONFIRMED: "Appointment confirmed",
  CANCELLED: "Appointment cancelled",
  COMPLETED: "Appointment completed",
  RESCHEDULED: "Appointment rescheduled",
  PENDING: "Appointment updated",
};

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

    // In-app + push notifications for everyone involved except the actor.
    const statusChanged = Boolean(status && status !== existingAppointment.status);
    const rescheduled = Boolean(
      dateTime &&
        new Date(dateTime).getTime() !== existingAppointment.dateTime.getTime(),
    );

    if (statusChanged || rescheduled) {
      const title = statusChanged
        ? APPOINTMENT_STATUS_TITLES[updatedAppointment.status] || "Appointment updated"
        : "Appointment rescheduled";
      const when = updatedAppointment.dateTime.toLocaleString();
      const doctorName = updatedAppointment.doctor?.user?.name || "your doctor";
      const patientName = updatedAppointment.patient?.name || "the patient";
      const statusLabel = updatedAppointment.status.toLowerCase();

      const recipients: NotifyInput[] = [];

      if (updatedAppointment.patientId !== session.userId) {
        recipients.push({
          userId: updatedAppointment.patientId,
          type: "APPOINTMENT",
          title,
          body: statusChanged
            ? `Your appointment with Dr. ${doctorName} on ${when} is now ${statusLabel}.`
            : `Your appointment with Dr. ${doctorName} was moved to ${when}.`,
          href: "/appointments",
          metadata: { appointmentId, status: updatedAppointment.status },
        });
      }

      if (updatedAppointment.doctor.userId !== session.userId) {
        recipients.push({
          userId: updatedAppointment.doctor.userId,
          type: "APPOINTMENT",
          title,
          body: statusChanged
            ? `The appointment with ${patientName} on ${when} is now ${statusLabel}.`
            : `The appointment with ${patientName} was moved to ${when}.`,
          href: "/doctor/appointments",
          metadata: { appointmentId, status: updatedAppointment.status },
        });
      }

      await notifyMany(recipients);
    }

    if (updatedAppointment.patient?.email && updatedAppointment.doctor?.user?.email) {
      const emailSent = await sendAppointmentStatusEmail({
        patientEmail: updatedAppointment.patient.email,
        patientName: updatedAppointment.patient.name || "Patient",
        doctorEmail: updatedAppointment.doctor.user.email,
        doctorName: updatedAppointment.doctor.user.name || "Doctor",
        dateTime: updatedAppointment.dateTime.toLocaleString(),
        status: updatedAppointment.status,
        notes: updatedAppointment.notes || undefined,
      });

      await writeAudit({
        action: "APPOINTMENT_STATUS_EMAIL_SENT",
        actorId: session.userId,
        actorRole: session.role,
        entityType: "APPOINTMENT",
        entityId: appointmentId,
        ip: getClientIp(request),
        metadata: {
          patientEmail: updatedAppointment.patient.email,
          doctorEmail: updatedAppointment.doctor.user.email,
          status: updatedAppointment.status,
          emailSent,
        },
      });
    }

    return NextResponse.json({
      message: `Appointment updated to status: ${updatedAppointment.status}.`,
      appointment: updatedAppointment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update appointment" }, { status: 500 });
  }
}
