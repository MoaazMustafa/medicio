import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authorize";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const hospitalId = searchParams.get("hospitalId");
    const verifiedOnly = searchParams.get("verified") === "true";
    const searchQuery = searchParams.get("search") || "";
    const includeScraped = searchParams.get("includeScraped") !== "false";

    // Query registered doctors
    const doctorWhere: any = {};
    if (specialty) doctorWhere.specialty = { contains: specialty, mode: "insensitive" };
    if (hospitalId) doctorWhere.hospitalId = hospitalId;
    if (verifiedOnly) doctorWhere.isVerified = true;
    if (searchQuery) {
      doctorWhere.OR = [
        { specialty: { contains: searchQuery, mode: "insensitive" } },
        { education: { contains: searchQuery, mode: "insensitive" } },
        { licenseNumber: { contains: searchQuery, mode: "insensitive" } },
        { user: { name: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    const registeredDoctors = await prisma.doctor.findMany({
      where: doctorWhere,
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
          },
        },
      },
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
    });

    let scrapedDoctors: any[] = [];
    if (includeScraped) {
      const scrapedWhere: any = { entityType: "DOCTOR" };
      if (searchQuery) {
        scrapedWhere.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { location: { contains: searchQuery, mode: "insensitive" } },
          { rawDetails: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      scrapedDoctors = await prisma.scrapedRecord.findMany({
        where: scrapedWhere,
        orderBy: { lastScraped: "desc" },
      });
    }

    // Standardize combined list
    const formattedRegistered = registeredDoctors.map((doc) => ({
      id: doc.id,
      userId: doc.userId,
      name: doc.user?.name || "Doctor",
      email: doc.user?.email,
      avatarUrl: doc.user?.avatarUrl,
      specialty: doc.specialty,
      education: doc.education,
      experience: doc.experience,
      licenseNumber: doc.licenseNumber,
      isVerified: doc.isVerified,
      bio: doc.bio,
      clinicAddress: doc.clinicAddress,
      consultationFee: doc.consultationFee,
      affiliationStatus: doc.affiliationStatus,
      affiliationRequestedBy: doc.affiliationRequestedBy,
      hospital: doc.hospital,
      availability: doc.availability ? JSON.parse(doc.availability) : null,
      aiTrainingData: doc.aiTrainingData ? JSON.parse(doc.aiTrainingData) : null,
      isScraped: false,
      createdAt: doc.createdAt,
    }));

    const formattedScraped = scrapedDoctors.map((scr) => {
      let raw: any = {};
      try {
        raw = JSON.parse(scr.rawDetails);
      } catch (e) {
        raw = {};
      }
      return {
        id: `scraped_${scr.id}`,
        name: scr.name,
        specialty: raw.specialty || "General Practice",
        education: raw.education || "Public Registry Record",
        experience: raw.experience || 0,
        licenseNumber: raw.licenseNumber || "UNVERIFIED-SCRAPED",
        isVerified: false,
        bio: raw.bio || "Scraped listing from public health registry directory.",
        clinicAddress: scr.location || "Local Health Clinic",
        consultationFee: raw.consultationFee || 0,
        contactInfo: scr.contactInfo,
        hospital: null,
        isScraped: true,
        lastScraped: scr.lastScraped,
      };
    });

    return NextResponse.json({
      doctors: [...formattedRegistered, ...formattedScraped],
      totalRegistered: formattedRegistered.length,
      totalScraped: formattedScraped.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch doctors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(["DOCTOR", "ADMIN", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const session = auth.session;

    const body = await request.json();
    const {
      specialty,
      education,
      experience,
      licenseNumber,
      bio,
      clinicAddress,
      consultationFee,
      hospitalId,
      availability,
    } = body;

    if (!specialty || !education || !licenseNumber) {
      return NextResponse.json(
        { error: "Specialty, education, and license number are required." },
        { status: 400 }
      );
    }

    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
    });

    let doctor;
    const availabilityString = availability
      ? typeof availability === "string"
        ? availability
        : JSON.stringify(availability)
      : undefined;

    if (existingDoctor) {
      doctor = await prisma.doctor.update({
        where: { id: existingDoctor.id },
        data: {
          specialty,
          education,
          experience: Number(experience) || 0,
          licenseNumber,
          bio: bio || existingDoctor.bio,
          clinicAddress: clinicAddress || existingDoctor.clinicAddress,
          consultationFee: consultationFee ? Number(consultationFee) : existingDoctor.consultationFee,
          hospitalId: hospitalId !== undefined ? hospitalId : existingDoctor.hospitalId,
          availability: availabilityString ?? existingDoctor.availability,
        },
        include: { user: true, hospital: true },
      });
    } else {
      doctor = await prisma.doctor.create({
        data: {
          userId: session.userId,
          specialty,
          education,
          experience: Number(experience) || 0,
          licenseNumber,
          isVerified: false, // Requires admin verification (FR-DOC-02)
          bio,
          clinicAddress,
          consultationFee: consultationFee ? Number(consultationFee) : 0,
          hospitalId: hospitalId || null,
          availability: availabilityString,
          affiliationStatus: hospitalId ? "PENDING_HOSPITAL_ACCEPT" : "INDEPENDENT",
          affiliationRequestedBy: hospitalId ? "DOCTOR" : null,
        },
        include: { user: true, hospital: true },
      });
    }

    return NextResponse.json({
      message: "Doctor profile saved successfully. Verification is pending admin review.",
      doctor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save doctor profile" }, { status: 500 });
  }
}
