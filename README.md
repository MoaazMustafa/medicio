# Medicio - AI-Powered Healthcare Access Platform

Medicio is a responsive web application designed to connect patients with verified healthcare professionals, hospitals, labs, and pharmacies, supplemented by interactive AI diagnostics.

## 🚀 Key Modules
The system is divided into twelve core modules:
1. **M1 — Authentication & Access Control (IAM / RBAC):** Strict role-based permissions (Super Admin, Doctor, Labs Admin, Patient, etc.).
2. **M2 — AI Symptom Checker & Recommendation Engine:** Patient-facing conversational intake flow that triages severity and suggests local providers.
3. **M3 — Specialty AI Agents:** Scoped conversational assistants bound to specific clinical entities and medical specialties.
4. **M4 — Doctor Management:** Verified credentials, bidirectionally requested affiliations, and custom emergency-training profiles.
5. **M5 — Hospital Management:** Facility profile configuration and affiliated provider search parameters.
6. **M6 — Pharmacy Management:** POS-synced and manually managed pharmacy inventory tracking.
7. **M7 — Lab Management:** Test diagnostic catalogues and report delivery into the Patient Portal.
8. **M8 — Appointment Booking:** Time-slot discovery, confirmations, and cancellations.
9. **M9 — Medicine Tracker:** Patient medicine intake tracking.
10. **M10 — Patient Portal & Health Records:** Consolidates clinical records, diagnostics, and consultation history.
11. **M11 — Data Aggregation & Scraper Engine:** Scrapes public medical directories for unverified listings.
12. **M12 — Analytics & Monitoring:** Product analytics tracking via PostHog integration.

## 🛠️ Technology Stack
- **Frontend Core:** Next.js 16 (App Router, Turbopack) & TypeScript
- **UI Styling:** HeroUI (v3) & Tailwind CSS v4
- **Database ORM:** Prisma ORM
- **Database Engine:** PostgreSQL (Relational Data Store)
- **State Management:** next-themes (Light/Dark mode transitions)
- **Product Analytics:** PostHog Integration

## ⚙️ How to Use

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
node node_modules/prisma/build/index.js generate
```

### 3. Run Development Server
```bash
npm run dev
```

---
*Created by Moaaz Mustafa — Medicio Healthcare Solutions.*
