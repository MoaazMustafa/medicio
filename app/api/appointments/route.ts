import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { sendAppointmentBookedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const whereCondition: any = {};
    if (session.role === "DOCTOR") {
      const doctor = await prisma.doctor.findUnique({ where: { userId: session.userId } });
      if (!doctor) {
        return NextResponse.json({ appointments: [] });
      }
      whereCondition.doctorId = doctor.id;
    } else if (session.role === "PATIENT") {
      whereCondition.patientId = session.userId;
    } else if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ appointments: [] });
    }

    if (status) {
      whereCondition.status = status;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            hospital: {
              select: {
                name: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { doctorId, dateTime, notes } = body;

    if (!doctorId || !dateTime) {
      return NextResponse.json({ error: "doctorId and dateTime are required" }, { status: 400 });
    }

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Target doctor not found" }, { status: 404 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: session.userId,
        doctorId,
        dateTime: new Date(dateTime),
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        patient: {
          select: { name: true, email: true },
        },
        doctor: {
          include: { user: true },
        },
      },
    });

    if (appointment.patient?.email && appointment.doctor?.user?.email) {
      sendAppointmentBookedEmail({
        patientEmail: appointment.patient.email,
        patientName: appointment.patient.name || "Patient",
        doctorEmail: appointment.doctor.user.email,
        doctorName: appointment.doctor.user.name || "Doctor",
        dateTime: appointment.dateTime.toLocaleString(),
        notes: appointment.notes || undefined,
      }).catch((err) => console.error("[email] Error sending appointment booked notification:", err));
    }

    return NextResponse.json({
      message: `Appointment request submitted with Dr. ${appointment.doctor.user.name}.`,
      appointment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create appointment" }, { status: 500 });
  }
}
