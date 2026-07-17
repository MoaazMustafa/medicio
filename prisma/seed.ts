import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing records (Optional, safe for development resets)
  await prisma.aIConversation.deleteMany({});
  await prisma.scrapedRecord.deleteMany({});
  await prisma.medicineTrackerEntry.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.labReport.deleteMany({});
  await prisma.pharmacyInventoryItem.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.pharmacy.deleteMany({});
  await prisma.lab.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Cleared existing data.");

  // 2. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@medicio.com",
      passwordHash: "$2b$10$EPzG2c.8PZ6wXh1M.ZfPceP9h/2ZzH2z437y8OqA26u2wG.uH27i6", // mock hashed password
      name: "Medicio Super Admin",
      role: UserRole.SUPER_ADMIN,
    },
  });

  const patient = await prisma.user.create({
    data: {
      email: "patient@medicio.com",
      passwordHash: "$2b$10$EPzG2c.8PZ6wXh1M.ZfPceP9h/2ZzH2z437y8OqA26u2wG.uH27i6",
      name: "Jane Doe",
      role: UserRole.PATIENT,
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: "doctor@medicio.com",
      passwordHash: "$2b$10$EPzG2c.8PZ6wXh1M.ZfPceP9h/2ZzH2z437y8OqA26u2wG.uH27i6",
      name: "Dr. Aisha Rahman",
      role: UserRole.DOCTOR,
    },
  });

  const hospitalUser = await prisma.user.create({
    data: {
      email: "hospital@medicio.com",
      passwordHash: "$2b$10$EPzG2c.8PZ6wXh1M.ZfPceP9h/2ZzH2z437y8OqA26u2wG.uH27i6",
      name: "City Health Admin",
      role: UserRole.HOSPITAL_ADMIN,
    },
  });

  const pharmacyUser = await prisma.user.create({
    data: {
      email: "pharmacy@medicio.com",
      passwordHash: "$2b$10$EPzG2c.8PZ6wXh1M.ZfPceP9h/2ZzH2z437y8OqA26u2wG.uH27i6",
      name: "Al-Shifa Pharmacy Admin",
      role: UserRole.PHARMACY_ADMIN,
    },
  });

  const labUser = await prisma.user.create({
    data: {
      email: "lab@medicio.com",
      passwordHash: "$2b$10$EPzG2c.8PZ6wXh1M.ZfPceP9h/2ZzH2z437y8OqA26u2wG.uH27i6",
      name: "BioLab Diagnostics Admin",
      role: UserRole.LAB_ADMIN,
    },
  });

  console.log("Created accounts.");

  // 3. Create Hospital
  const hospital = await prisma.hospital.create({
    data: {
      name: "City General Hospital",
      location: "Sector-5 Medical District",
      facilities: "Emergency Triage, ICU, Cardiology, Pediatrics, Diagnostic Labs",
      isVerified: true,
      userId: hospitalUser.id,
    },
  });

  // 4. Create Doctor Profile (affiliated with Hospital)
  const doctor = await prisma.doctor.create({
    data: {
      userId: doctorUser.id,
      specialty: "Cardiology",
      education: "MD - Johns Hopkins University, FACC",
      experience: 12,
      licenseNumber: "LIC-102938475",
      isVerified: true,
      hospitalId: hospital.id,
      availability: JSON.stringify({
        workingDays: ["Monday", "Wednesday", "Friday"],
        workingHours: "09:00 - 17:00",
        slotDurationMinutes: 30,
      }),
    },
  });

  // 5. Create Pharmacy & Inventory Items
  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: "Al-Shifa Pharmacy",
      location: "Sector-5 Plaza (Adjacent to City Hospital)",
      isVerified: true,
      userId: pharmacyUser.id,
      hospitalId: hospital.id,
    },
  });

  await prisma.pharmacyInventoryItem.createMany({
    data: [
      { pharmacyId: pharmacy.id, name: "Paracetamol 500mg", price: 1.5, stock: 120 },
      { pharmacyId: pharmacy.id, name: "Ibuprofen 400mg", price: 2.2, stock: 90 },
      { pharmacyId: pharmacy.id, name: "Amoxicillin 250mg", price: 8.5, stock: 45 },
      { pharmacyId: pharmacy.id, name: "Cetirizine 10mg", price: 3.0, stock: 200 },
    ],
  });

  // 6. Create Lab
  const lab = await prisma.lab.create({
    data: {
      name: "BioLab Diagnostic Labs",
      isVerified: true,
      userId: labUser.id,
      hospitalId: hospital.id,
    },
  });

  // 7. Create Lab Report
  await prisma.labReport.create({
    data: {
      patientId: patient.id,
      labId: lab.id,
      testName: "Complete Blood Count (CBC)",
      resultData: JSON.stringify({
        hemoglobin: "14.2 g/dL (Normal)",
        wbc: "6.8 x10^3/uL (Normal)",
        platelets: "250 x10^3/uL (Normal)",
      }),
      fileUrl: "https://medicio-storage.local/reports/cbc_jane_doe.pdf",
    },
  });

  // 8. Create Appointment
  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      status: "PENDING",
      notes: "Routine checkup following recent fatigue.",
    },
  });

  // 9. Create Medicine Tracker Entries
  await prisma.medicineTrackerEntry.create({
    data: {
      userId: patient.id,
      medicineName: "Vitamin D3 1000 IU",
      dosage: "1 capsule",
      frequency: "Once daily, with food",
      startDate: new Date(),
    },
  });

  // 10. Create Scraped/Unverified Record cache
  await prisma.scrapedRecord.create({
    data: {
      entityType: "PHARMACY",
      name: "Community Health Meds",
      contactInfo: "+1 (555) 0192-384",
      location: "Sector-3 Plaza",
      rawDetails: JSON.stringify({
        openingHours: "08:00 - 22:00",
        source: "Public Registry Crawler",
      }),
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
