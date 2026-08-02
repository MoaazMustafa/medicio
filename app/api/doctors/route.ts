import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { requireRole } from "@/lib/authorize";
import { sendDoctorApplicationSubmittedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

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
    const formattedRegistered = registeredDoctors.map((doc: any) => ({
      id: doc.id,
      userId: doc.userId,
      name: doc.user?.name || "Doctor",
      email: doc.user?.email,
      avatarUrl: doc.user?.avatarUrl,
      specialty: doc.specialty,
      subSpecialty: doc.subSpecialty,
      education: doc.education,
      experience: doc.experience,
      licenseNumber: doc.licenseNumber,
      issuingBoard: doc.issuingBoard,
      nationalIdNumber: doc.nationalIdNumber,
      documentUrl: doc.documentUrl,
      isVerified: doc.isVerified,
      verificationStatus: doc.verificationStatus || (doc.isVerified ? "APPROVED" : "PENDING"),
      rejectionReason: doc.rejectionReason,
      isReviewRequested: doc.isReviewRequested,
      reviewNotes: doc.reviewNotes,
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
      subSpecialty,
      education,
      experience,
      licenseNumber,
      issuingBoard,
      nationalIdNumber,
      documentUrl,
      bio,
      clinicAddress,
      consultationFee,
      hospitalId,
      availability,
      reviewNotes,
    } = body;

    if (!specialty || !education || !licenseNumber) {
      return NextResponse.json(
        { error: "Specialty, education, and license number are required for verification." },
        { status: 400 }
      );
    }

    const existingDoctor = await prisma.doctor.findUnique({
      where: { userId: session.userId },
    });

    let doctor: any;
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
          subSpecialty: subSpecialty || existingDoctor.subSpecialty,
          education,
          experience: Number(experience) || 0,
          licenseNumber,
          issuingBoard: issuingBoard || existingDoctor.issuingBoard,
          nationalIdNumber: nationalIdNumber || existingDoctor.nationalIdNumber,
          documentUrl: documentUrl || existingDoctor.documentUrl,
          isVerified: false,
          verificationStatus: "PENDING",
          rejectionReason: null,
          isReviewRequested: Boolean(reviewNotes),
          reviewNotes: reviewNotes || existingDoctor.reviewNotes,
          bio: bio || existingDoctor.bio,
          clinicAddress: clinicAddress || existingDoctor.clinicAddress,
          consultationFee: consultationFee ? Number(consultationFee) : existingDoctor.consultationFee,
          hospitalId: hospitalId !== undefined ? hospitalId : existingDoctor.hospitalId,
          availability: availabilityString ?? existingDoctor.availability,
        } as any,
        include: { user: true, hospital: true },
      });
    } else {
      doctor = await prisma.doctor.create({
        data: {
          userId: session.userId,
          specialty,
          subSpecialty,
          education,
          experience: Number(experience) || 0,
          licenseNumber,
          issuingBoard,
          nationalIdNumber,
          documentUrl,
          isVerified: false, // Requires admin verification (FR-DOC-02)
          verificationStatus: "PENDING",
          rejectionReason: null,
          isReviewRequested: Boolean(reviewNotes),
          reviewNotes,
          bio,
          clinicAddress,
          consultationFee: consultationFee ? Number(consultationFee) : 0,
          hospitalId: hospitalId || null,
          availability: availabilityString,
          affiliationStatus: hospitalId ? "PENDING_HOSPITAL_ACCEPT" : "INDEPENDENT",
          affiliationRequestedBy: hospitalId ? "DOCTOR" : null,
        } as any,
        include: { user: true, hospital: true },
      });
    }

    // Record submission snapshot in DoctorApplicationHistory
    try {
      await (prisma as any).doctorApplicationHistory.create({
        data: {
          doctorId: doctor.id,
          specialty: doctor.specialty,
          subSpecialty: doctor.subSpecialty || null,
          education: doctor.education,
          experience: doctor.experience,
          licenseNumber: doctor.licenseNumber,
          issuingBoard: doctor.issuingBoard || null,
          nationalIdNumber: doctor.nationalIdNumber || null,
          documentUrl: doctor.documentUrl || null,
          status: "PENDING",
          reviewNotes: reviewNotes || null,
        },
      });
    } catch (histErr) {
      console.error("Failed to log application history entry:", histErr);
    }

    await writeAudit({
      action: "DOCTOR_PROFILE_SUBMITTED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "DOCTOR",
      entityId: doctor.id,
      ip: getClientIp(request),
      metadata: {
        doctorId: doctor.id,
        specialty: doctor.specialty,
        licenseNumber: doctor.licenseNumber,
        education: doctor.education,
        hospitalId: doctor.hospitalId,
        verificationStatus: doctor.verificationStatus,
      },
    });

    if (doctor.user?.email) {
      const emailSent = await sendDoctorApplicationSubmittedEmail(
        doctor.user.email,
        doctor.user.name || "Practitioner",
        doctor.specialty
      );

      await writeAudit({
        action: "DOCTOR_APPLICATION_SUBMITTED_EMAIL_SENT",
        actorId: session.userId,
        actorRole: session.role,
        entityType: "DOCTOR",
        entityId: doctor.id,
        ip: getClientIp(request),
        metadata: {
          email: doctor.user.email,
          specialty: doctor.specialty,
          emailSent,
        },
      });
    }

    return NextResponse.json({
      message: "Doctor verification credentials submitted. Pending administrator review.",
      doctor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save doctor profile" }, { status: 500 });
  }
}
