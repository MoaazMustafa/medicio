import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { writeAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/medicine-tracker/[entryId]
 * Update an existing medicine tracker entry owned by the authenticated patient.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entryId } = await params;
    const body = await request.json();
    const { medicineName, dosage, frequency, startDate, endDate } = body;

    // Verify ownership
    const existing = await prisma.medicineTrackerEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.medicineTrackerEntry.update({
      where: { id: entryId },
      data: {
        ...(medicineName && { medicineName: medicineName.trim() }),
        ...(dosage && { dosage: dosage.trim() }),
        ...(frequency && { frequency: frequency.trim() }),
        ...(startDate && { startDate: new Date(startDate) }),
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    await writeAudit({
      action: "MEDICINE_ENTRY_UPDATED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "MedicineTrackerEntry",
      entityId: entryId,
      metadata: { medicineName: updated.medicineName },
    });

    return NextResponse.json({ message: "Medicine entry updated.", entry: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update medicine entry" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/medicine-tracker/[entryId]
 * Remove a medicine tracker entry owned by the authenticated patient.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entryId } = await params;

    // Verify ownership
    const existing = await prisma.medicineTrackerEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    if (existing.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.medicineTrackerEntry.delete({ where: { id: entryId } });

    await writeAudit({
      action: "MEDICINE_ENTRY_DELETED",
      actorId: session.userId,
      actorRole: session.role,
      entityType: "MedicineTrackerEntry",
      entityId: entryId,
      metadata: { medicineName: existing.medicineName },
    });

    return NextResponse.json({ message: "Medicine entry removed." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete medicine entry" },
      { status: 500 },
    );
  }
}
