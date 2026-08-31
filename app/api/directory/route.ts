import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export interface DirectoryEntity {
  id: string;
  entityType: "DOCTOR" | "HOSPITAL" | "PHARMACY" | "LAB";
  name: string;
  subTitle?: string;
  location: string;
  contactInfo?: string;
  avatarUrl?: string;
  isVerified: boolean;
  verificationStatus?: string;
  experience?: number;
  education?: string;
  consultationFee?: number;
  facilities?: string[];
  hospitalName?: string;
  isScraped: boolean;
  availability?: any;
  doctorUserId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = (searchParams.get("type") || "ALL").toUpperCase();
    const searchQuery = (searchParams.get("search") || "").trim();
    const specialty = (searchParams.get("specialty") || "").trim();
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const includeScraped = searchParams.get("includeScraped") !== "false";

    const results: DirectoryEntity[] = [];

    // ─── 1. DOCTORS ──────────────────────────────────────────────────────────
    if (entityType === "ALL" || entityType === "DOCTOR") {
      const docWhere: any = {};
      if (verifiedOnly) docWhere.isVerified = true;
      if (specialty) {
        docWhere.specialty = { contains: specialty, mode: "insensitive" };
      }
      if (searchQuery) {
        docWhere.OR = [
          { specialty: { contains: searchQuery, mode: "insensitive" } },
          { education: { contains: searchQuery, mode: "insensitive" } },
          { user: { name: { contains: searchQuery, mode: "insensitive" } } },
          { clinicAddress: { contains: searchQuery, mode: "insensitive" } },
          { hospital: { name: { contains: searchQuery, mode: "insensitive" } } },
        ];
      }

      const doctors = await prisma.doctor.findMany({
        where: docWhere,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          hospital: { select: { id: true, name: true, location: true } },
        },
        orderBy: [{ isVerified: "desc" }, { experience: "desc" }],
      });

      for (const d of doctors) {
        let parsedAvail = null;
        try {
          if (d.availability) parsedAvail = JSON.parse(d.availability);
        } catch {
          // ignore
        }

        results.push({
          id: d.id,
          entityType: "DOCTOR",
          name: d.user?.name || "Medical Practitioner",
          subTitle: d.specialty + (d.subSpecialty ? ` • ${d.subSpecialty}` : ""),
          location: d.clinicAddress || d.hospital?.location || "Medicio Clinical Center",
          contactInfo: d.user?.email || undefined,
          avatarUrl: d.user?.avatarUrl || undefined,
          isVerified: d.isVerified,
          verificationStatus: d.verificationStatus || (d.isVerified ? "APPROVED" : "PENDING"),
          experience: d.experience,
          education: d.education,
          consultationFee: d.consultationFee ?? 50,
          hospitalName: d.hospital?.name,
          isScraped: false,
          availability: parsedAvail,
          doctorUserId: d.user?.id,
        });
      }
    }

    // ─── 2. HOSPITALS ────────────────────────────────────────────────────────
    if (entityType === "ALL" || entityType === "HOSPITAL") {
      const hospWhere: any = {};
      if (verifiedOnly) hospWhere.isVerified = true;
      if (searchQuery) {
        hospWhere.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { location: { contains: searchQuery, mode: "insensitive" } },
          { facilities: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      const hospitals = await prisma.hospital.findMany({
        where: hospWhere,
        include: {
          doctors: { select: { id: true } },
          labs: { select: { id: true } },
          pharmacies: { select: { id: true } },
        },
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      });

      for (const h of hospitals) {
        let facArray: string[] = [];
        try {
          facArray = h.facilities.split(",").map((f) => f.trim()).filter(Boolean);
        } catch {
          facArray = [];
        }

        results.push({
          id: h.id,
          entityType: "HOSPITAL",
          name: h.name,
          subTitle: `Hospital Facility • ${h.doctors.length} Doctors, ${h.labs.length} Labs`,
          location: h.location,
          isVerified: h.isVerified,
          facilities: facArray,
          isScraped: false,
        });
      }
    }

    // ─── 3. PHARMACIES ───────────────────────────────────────────────────────
    if (entityType === "ALL" || entityType === "PHARMACY") {
      const pharmWhere: any = {};
      if (verifiedOnly) pharmWhere.isVerified = true;
      if (searchQuery) {
        pharmWhere.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { location: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      const pharmacies = await prisma.pharmacy.findMany({
        where: pharmWhere,
        include: {
          hospital: { select: { name: true } },
          inventory: { select: { id: true } },
        },
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      });

      for (const p of pharmacies) {
        results.push({
          id: p.id,
          entityType: "PHARMACY",
          name: p.name,
          subTitle: p.hospital?.name ? `Affiliated with ${p.hospital.name}` : `Retail Pharmacy • ${p.inventory.length} In-stock items`,
          location: p.location,
          isVerified: p.isVerified,
          hospitalName: p.hospital?.name,
          isScraped: false,
        });
      }
    }

    // ─── 4. LABS ─────────────────────────────────────────────────────────────
    if (entityType === "ALL" || entityType === "LAB") {
      const labWhere: any = {};
      if (verifiedOnly) labWhere.isVerified = true;
      if (searchQuery) {
        labWhere.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      const labs = await prisma.lab.findMany({
        where: labWhere,
        include: {
          hospital: { select: { name: true, location: true } },
        },
        orderBy: [{ isVerified: "desc" }, { name: "asc" }],
      });

      for (const l of labs) {
        results.push({
          id: l.id,
          entityType: "LAB",
          name: l.name,
          subTitle: l.hospital?.name ? `Affiliated with ${l.hospital.name}` : "Certified Diagnostic & Pathology Lab",
          location: l.hospital?.location || "Medicio Certified Lab Network",
          isVerified: l.isVerified,
          hospitalName: l.hospital?.name,
          isScraped: false,
        });
      }
    }

    // ─── 5. SCRAPED RECORDS (Fallback & Aggregated Public Listings) ───────────
    if (includeScraped && !verifiedOnly) {
      const scrapedWhere: any = {};
      if (entityType !== "ALL") {
        scrapedWhere.entityType = entityType;
      }
      if (searchQuery) {
        scrapedWhere.OR = [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { location: { contains: searchQuery, mode: "insensitive" } },
          { rawDetails: { contains: searchQuery, mode: "insensitive" } },
        ];
      }

      const scraped = await prisma.scrapedRecord.findMany({
        where: scrapedWhere,
        orderBy: { lastScraped: "desc" },
        take: 30,
      });

      for (const s of scraped) {
        let details: any = {};
        try {
          details = JSON.parse(s.rawDetails);
        } catch {
          // ignore
        }

        results.push({
          id: s.id,
          entityType: s.entityType as any,
          name: s.name,
          subTitle: details.specialty || details.category || "Public Medical Listing",
          location: s.location || details.address || "Unverified Location",
          contactInfo: s.contactInfo || details.phone || undefined,
          isVerified: false,
          isScraped: true,
          consultationFee: details.fee ? Number(details.fee) : undefined,
          experience: details.experience ? Number(details.experience) : undefined,
        });
      }
    }

    // Sort combined results so verified providers come first, then alphabetical
    results.sort((a, b) => {
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    const counts = {
      all: results.length,
      doctors: results.filter((r) => r.entityType === "DOCTOR").length,
      hospitals: results.filter((r) => r.entityType === "HOSPITAL").length,
      pharmacies: results.filter((r) => r.entityType === "PHARMACY").length,
      labs: results.filter((r) => r.entityType === "LAB").length,
      verifiedCount: results.filter((r) => r.isVerified).length,
    };

    return NextResponse.json({
      success: true,
      counts,
      providers: results,
    });
  } catch (error: any) {
    console.error("[DIRECTORY API ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to query healthcare provider directory" },
      { status: 500 },
    );
  }
}
