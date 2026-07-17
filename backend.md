# Medicio Backend Architecture & API Specification

This document details the backend routing structure, middleware authorization rules, and external service tasks for Medicio.

---

## Next.js API Directory Structure
All backend handlers reside in `app/api/` using Next.js Route Handlers.
```
app/api/
├── auth/
│   ├── login/route.ts
│   └── register/route.ts
├── symptom-checker/
│   └── route.ts
├── agents/
│   ├── [agentId]/route.ts
│   └── train/route.ts
├── doctors/
│   ├── route.ts
│   ├── [doctorId]/route.ts
│   └── verify/route.ts
├── hospitals/
│   ├── route.ts
│   └── [hospitalId]/route.ts
├── pharmacies/
│   ├── route.ts
│   └── inventory/route.ts
├── labs/
│   ├── route.ts
│   └── reports/route.ts
├── appointments/
│   ├── route.ts
│   └── [appointmentId]/route.ts
├── medicine-tracker/
│   └── route.ts
└── admin/
    ├── scraper/route.ts
    └── logs/route.ts
```

---

## Endpoint Specifications

### 1. Authentication (`/api/auth`)
- **POST `/api/auth/register`**: Registers a new user. Enforces valid email formats and securely hashes passwords.
- **POST `/api/auth/login`**: Authenticates user and issues a JWT token/session.

### 2. Conversational Intake (`/api/symptom-checker`)
- **POST `/api/symptom-checker`**: Accepts a patient's natural language symptom description along with pre-existing conditions, medicine history, and treatment type, calling the LLM endpoint and returning severity triage with local doctor referrals.

### 3. Specialty Agents (`/api/agents`)
- **POST `/api/agents/train`**: Allows Doctors to submit answers to specialty emergency questions to fine-tune their bot.
- **POST `/api/agents/[agentId]`**: Queries a doctor or lab bot context.

### 4. Appointment Booking (`/api/appointments`)
- **GET `/api/appointments`**: Retrieves booked slots (scoped to Patient or Doctor).
- **POST `/api/appointments`**: Reserves an available slot on a Doctor's calendar.
- **PATCH `/api/appointments/[appointmentId]`**: Accept, reschedule, or cancel appointments.

---

## Role-Based Access Control (RBAC) Middleware

API actions check the resolved token role before handling execution.

```typescript
// Conceptual authorization middleware
export async function authorize(request: NextRequest, allowedRoles: UserRole[]) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
```

### Route-Level Access Settings
- **`/api/admin/*`**: Restricts access exclusively to `SUPER_ADMIN`.
- **`/api/doctors/verify`**: Restricted to `SUPER_ADMIN` and `ADMIN` (credential approval).
- **`/api/pharmacies/inventory`**: Write access restricted to `PHARMACY_ADMIN`.
- **`/api/labs/reports`**: Write access restricted to `LAB_ADMIN`.
- **`/api/medicine-tracker`**: Access restricted to `PATIENT` (general `User`).

---

## Background & Integration Jobs

### 1. Pharmacy POS Synchronization
- **Cadence**: Cron schedule running hourly or daily depending on plan.
- **Task**: Standardized parser adapters fetch current inventories (SKU, Price, Units) from individual pharmacy points-of-sale and upsert them to `PharmacyInventoryItem` tables.

### 2. Admin Scraper Engine
- **Cadence**: Triggered manually by Super Admin, or scheduled off-peak.
- **Task**: Executes website crawlers on target clinical sites to build list items for `ScrapedRecord` entities. Deduplicates existing records using exact address and license values.
