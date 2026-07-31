import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            location: true,
            facilities: true,
          },
        },
        appointments: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { dateTime: "asc" },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({
        exists: false,
        message: "No doctor profile found for current user.",
      });
    }

    return NextResponse.json({
      exists: true,
      doctor: {
        ...doctor,
        availability: doctor.availability ? JSON.parse(doctor.availability) : null,
        aiTrainingData: doctor.aiTrainingData ? JSON.parse(doctor.aiTrainingData) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch doctor profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor profile not found." }, { status: 404 });
    }

    const body = await request.json();
    const {
      specialty,
      education,
      experience,
      licenseNumber,
      bio,
      clinicAddress,
      consultationFee,
      availability,
    } = body;

    const updatedData: any = {};
    if (specialty !== undefined) updatedData.specialty = specialty;
    if (education !== undefined) updatedData.education = education;
    if (experience !== undefined) updatedData.experience = Number(experience);
    if (licenseNumber !== undefined) updatedData.licenseNumber = licenseNumber;
    if (bio !== undefined) updatedData.bio = bio;
    if (clinicAddress !== undefined) updatedData.clinicAddress = clinicAddress;
    if (consultationFee !== undefined) updatedData.consultationFee = Number(consultationFee);
    if (availability !== undefined) {
      updatedData.availability =
        typeof availability === "string" ? availability : JSON.stringify(availability);
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: updatedData,
      include: {
        user: true,
        hospital: true,
      },
    });

    return NextResponse.json({
      message: "Doctor profile updated successfully.",
      doctor: {
        ...updatedDoctor,
        availability: updatedDoctor.availability ? JSON.parse(updatedDoctor.availability) : null,
        aiTrainingData: updatedDoctor.aiTrainingData ? JSON.parse(updatedDoctor.aiTrainingData) : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update doctor profile" }, { status: 500 });
  }
}
