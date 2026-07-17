# Medicio — Product Requirements Document

> Derived from `Medicio_SRS_v1_0.docx` (July 11, 2026). Where the SRS left something
> open, it's marked **[Open]** below — see Section 7 for the full list.

## 1. Overview

Medicio is an AI-powered healthcare access platform (web app) that connects patients
with an AI symptom-checking assistant, registered doctors, hospitals, pharmacies, and
diagnostic labs. The platform blends two data tiers:

- **Verified/Registered** — doctors, hospitals, pharmacies, and labs who have signed
  up and (for doctors) passed credential verification.
- **Scraped/Suggested** — public-source listings pulled in by a Super-Admin-only
  aggregation engine, shown as a fallback when verified coverage is thin, always
  visually tagged as unverified.

Verified data always wins in a conflict. That precedence rule is the spine of the
product — it shows up in the AI recommendations, the search results, and the data
model.

## 2. Problem & Vision

Patients often don't know whether a symptom needs a doctor, which doctor to see, or
where to get medicine/tests nearby — especially where registered-provider coverage is
patchy. Medicio's AI symptom checker triages that first question conversationally,
then routes the patient to a real doctor, pharmacy, or lab, preferring platform-verified
providers but falling back to aggregated public listings so the patient is never left
without an option.

## 3. Target Users

Eight roles across three classes, all governed by a single RBAC core:

| Role | Class | What they do on Medicio |
| --- | --- | --- |
| Super Admin | Administrative | Full system access; only role with scraper config, raw scraped data, and system logs; can define Custom Roles |
| Admin/Manager | Administrative | Day-to-day ops — support, content oversight, verification approvals — without system/scraper/log access |
| Doctor | Healthcare Professional | Manages own profile, availability, appointments; trains a personal AI agent; independent or hospital-affiliated |
| Hospital Admin | Healthcare Professional | Manages hospital profile and its affiliated doctors, labs, pharmacies |
| Labs Admin | Healthcare Professional | Manages lab profile, test catalogue, pricing, wait times, patient report uploads |
| Pharmacy Admin | Healthcare Professional | Manages pharmacy profile and inventory (POS-synced or manual) |
| User (Patient) | General | Primary consumer — symptom checker, booking, medicine tracker, patient portal |
| Custom Role | General | Super-Admin-defined role for anything outside the predefined set |

## 4. Core Features

Grouped by who mainly touches them. Module codes (M1–M12) map back to the SRS and to
`Architecture.md`.

### 4.1 Patient-facing

- **AI Symptom Checker (M2)** — conversational triage. Collects symptom description
  plus mandatory intake (duration, medicines already tried, pre-existing conditions,
  prior treatment approach incl. Tibb) before producing: severity level, ranked
  possible conditions, doctor-visit recommendation, and temporary medicine
  suggestions cross-checked against the patient's disclosed history. Always paired
  with a persistent medical disclaimer.
- **Specialty AI Agents (M3)** — narrow chat agents. Two flavors: entity-scoped (bound
  to one Doctor/Hospital/Lab, answers only about that entity) and specialty-scoped
  (AI Dermatologist, AI Cardiologist, etc., trained on real consultation data). Can
  recommend booking, refer medicine, refer a lab test.
- **Appointment Booking (M8)** — search doctors by specialty/availability/proximity,
  book against a registered doctor's published availability, get notified on status
  changes.
- **Medicine Tracker (M9)** — log current medicines with dosage/schedule; history feeds
  the AI checker's "medicines used before" intake question directly.
- **Patient Portal (M10)** — one consolidated view of lab reports, medicine history,
  appointment history, and AI/agent consultation history. Access is patient-only plus
  explicitly authorized professionals.

### 4.2 Provider-facing

- **Doctor Management (M4)** — registration, credential submission for verification,
  self-managed availability (even when hospital-affiliated), bidirectional hospital
  affiliation requests, AI-agent training via a specialty question set, appointment
  management (accept/reschedule/cancel/complete).
- **Hospital Management (M5)** — hospital profile, manages affiliated doctors/labs/
  pharmacies as linked sections; scraped hospital records get website-based
  enrichment (specialists, treatments, internal labs) when a public site is found.
- **Pharmacy Management (M6)** — profile, POS-synced inventory plus manual dashboard
  entry.
- **Lab Management (M7)** — profile with certification, test catalogue/pricing/wait
  times, uploads reports tied to a patient ID (feeds the Patient Portal directly).

### 4.3 Platform / Admin

- **Identity & Access Control (M1)** — registration/login, RBAC enforced server-side
  on every protected action (not just UI), predefined + Custom Roles, token-based
  sessions with expiry, verification workflow gate for Healthcare Professional roles.
- **Data Aggregation / Scraper Engine (M11)** — Super-Admin-only. One scraper per
  entity type, sourcing Facebook/Google Maps/public listing sites, tagging every
  record as scraped/suggested, deduplicating against verified records (verified
  wins), scheduled re-runs.
- **Analytics, Logging & Monitoring (M12)** — full audit trail of user actions,
  PostHog product analytics across major flows, Super-Admin-only dashboard.

## 5. Priority

Straight from the SRS's FR priority tags — useful for sequencing (see `Process.md`):

- **High**: core auth/RBAC, symptom checker intake+output, specialty agent scoping,
  doctor verification + availability, hospital/pharmacy/lab registration, appointment
  booking core loop, patient portal, scraper tagging/dedup, audit logging + PostHog.
- **Medium**: hospital-affiliated doctor detail management, independent-doctor
  profiles, appointment notifications/history, medicine tracker fields, WCAG AA
  target, verification workflow SLA.
- **Low**: dose reminders, agent-to-training-source traceability, scraper run-frequency
  tuning.

## 6. Out of Scope (per SRS §1.2)

- Native mobile app
- Payment/billing processing
- Telemedicine (video consultation) infrastructure
- Third-party insurance integration

None of these were raised in the original requirements session; they're candidates
for a future revision.

## 7. Key Assumptions & Open Questions

The SRS flags these as judgment calls made while formalizing informal meeting notes —
worth confirming before/while building, since several affect the data model or UX
directly:

| Topic | Assumption made | Needs confirming |
| --- | --- | --- |
| Auth method | Email/password | Is social/OAuth login also required? |
| Pharmacy search radius | Default 5km, user-adjustable | Notes had a likely typo ("SKM") — confirm intended default |
| Hospital search radius | No default cap, user-narrowable | Confirm this asymmetry with pharmacies is intentional |
| Pharmacy POS integration | Adapter-per-vendor middleware | Which POS vendors, what sync frequency? |
| Medicine Tracker fields | Dosage + schedule + history | Validate against real patient needs |
| Notification channel | Not decided | SMS vs. email vs. push, for appointments and dose reminders |
| Scraping Facebook/Google Maps | Flagged as ToS risk | Needs legal review; consider official APIs (e.g. Places API) instead |
| Health-data compliance regime | GDPR-style as interim baseline | Confirm actual applicable regulation with legal counsel |
| Doctor credential verification | Workflow undefined | Needs required docs, reviewer role, turnaround SLA |
| Scraper run frequency | Configurable schedule | Tune post-launch |
| Custom role granularity | Undefined | Screen-level, action-level, or data-level permissions? |

## 8. Non-Negotiables (compliance-driven, carry into every relevant feature)

- AI health output is **advisory only** — persistent medical disclaimer required
  everywhere it appears (M2, M3).
- Scraped data must be visually distinguishable from verified data on **every** surface
  where both can appear — never silently mixed.
- All patient health data encrypted in transit and at rest.
- Scraper config, raw scraped data, and system logs: Super Admin only, no exceptions.
