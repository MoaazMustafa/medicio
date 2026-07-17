# Medicio — Build Process

> Phased breakdown, sequenced against the module dependency chain from
> `Architecture.md` §6 (which itself comes from each module's "Dependencies" field
> in the SRS). Each phase should leave you with something runnable and demoable —
> useful for FYP progress checkpoints, not just a task list.

## Phase 0 — Foundations

Nothing user-facing yet; this is the scaffolding everything else builds on.

- Repo setup: Next.js (App Router) + TypeScript + Tailwind, Supabase project, Prisma
  connected to it
- `schema.prisma`: core entities from SRS §7 (User, Role, Permission at minimum)
- Base design-system components (`components/ui/`)
- `.env.example`, deployment target decided (Vercel + Supabase is the natural fit
  for this stack)
- CI: lint + typecheck on push

## Phase 1 — M1: Identity & Access Control

Everything else depends on this module, so it goes first and gets the most scrutiny.

- Registration/login via Supabase Auth
- `Role` / `Permission` tables (data-driven, not hardcoded — see `Architecture.md` §5)
- Predefined roles seeded: Super Admin, Admin/Manager, Doctor, Hospital Admin, Labs
  Admin, Pharmacy Admin, User
- `lib/auth` permission-check helper, used by `middleware.ts` and every Server Action
  from here on
- Session expiry
- **Not yet**: Custom Role UI (defer to Phase 8 — low usage until other roles exist)

**Checkpoint**: a user can register, log in, and hit a role-gated page that correctly
403s for the wrong role.

## Phase 2 — Entity registration MVP (M4, M5, M6, M7)

Basic CRUD profiles for the four provider types, no scraper or AI dependency yet.

- Doctor: registration, credential upload (storage only — verification workflow is
  its own item below), profile fields
- Hospital: registration, profile, empty "affiliated doctors/labs/pharmacies" sections
- Pharmacy: registration, profile, manual inventory entry (POS sync deferred)
- Lab: registration, profile, test catalogue
- Doctor credential verification workflow: **[Open in SRS]** the review process
  (documents, reviewer role, SLA) isn't defined — decide this before building the
  approval UI, don't guess at it mid-implementation
- Bidirectional hospital↔doctor affiliation requests

**Checkpoint**: each provider role can self-register and manage a basic profile;
Admin/Manager can approve a doctor's credentials.

## Phase 3 — M8: Appointment Booking

- Patient-side: search/browse doctors by specialty, availability, proximity
- Booking against a doctor's published availability
- Doctor-side: accept / reschedule / cancel / mark complete
- Appointment history (both sides)
- Notification channel: **[Open in SRS]** not specified — pick one (email is the
  simplest starting point) rather than blocking the phase on it

**Checkpoint**: a patient can find and book a real doctor end to end.

## Phase 4 — M2: AI Symptom Checker (MVP scope)

- LLM provider selected and wired in (`lib/ai`) — **[Open in SRS]** which provider
- Conversational intake flow (mandatory fields before result)
- Severity + possible-condition + visit-recommendation output
- Cross-check suggested medicine against disclosed conditions/history
- Nearby doctor/pharmacy/lab suggestions — **verified providers only at this stage**;
  scraped fallback comes online in Phase 6 once the scraper exists
- Persistent disclaimer on every AI surface
- Graceful failure state if the LLM provider errors

**Checkpoint**: a patient can run a full symptom-check conversation and get a
recommendation grounded in real registered providers.

## Phase 5 — M9 + M10: Medicine Tracker & Patient Portal

- Medicine Tracker: log medicine + dosage/schedule, view history
- Wire tracker history into the symptom checker's intake as pre-fill context
- Patient Portal: consolidated view — lab reports (stub until Phase 2's Lab module
  produces real ones), medicine history, appointment history, AI consultation history
- Access restricted to the patient + explicitly authorized professionals

**Checkpoint**: a patient has one place to see everything the platform knows about
their care so far.

## Phase 6 — M11: Data Aggregation / Scraper Engine

The riskiest module — legal exposure (SRS §8 flags Facebook/Google Maps scraping as a
possible ToS conflict) and the most infrastructure-heavy (background jobs).

- **Before writing scraper code**: resolve the legal-review flag from SRS §8. Decide
  whether to scrape directly or use official APIs (e.g. a maps Places API) as a
  lower-risk source.
- Per-entity scraper adapters (Doctor, Hospital, Pharmacy, Lab), one each
- Background job runner wired in (async, off the request path)
- Dedup logic against verified records — verified always wins
- Scraped-record tagging surfaced through the UI everywhere scraped data can appear
- Wire scraped fallback into Phase 3's search and Phase 4's AI recommendations
- Super-Admin-only scraper config screen
- Scheduled re-runs

**Checkpoint**: a search in a low-coverage area returns tagged scraped listings
instead of nothing.

## Phase 7 — M3: Specialty AI Agents

Builds on the Doctor module (training source) and Appointment Booking (referral
action), so it comes after both are stable.

- Entity-scoped agents (Doctor/Hospital/Lab Agent), each restricted to its bound
  entity's data — explicit scope guard, not just prompt instruction
- Doctor-side training flow: structured specialty question set
- Specialty-level personas (AI Dermatologist, etc.) — **[Open in SRS]** training-data
  consent/anonymization isn't resolved; don't wire real consultation data in until
  that's settled — build against synthetic/placeholder training data if needed to
  keep the phase moving
- Referral actions: book consultation, refer medicine, refer lab test

**Checkpoint**: a patient can chat with a specific doctor's agent and get an answer
that stays within that doctor's scope.

## Phase 8 — M12: Analytics, Logging, and platform hardening

- Audit log wired into every write path established in prior phases (retrofit where
  missed)
- PostHog integrated across major flows
- Super Admin analytics/log dashboard
- Custom Role UI (deferred from Phase 1, now that there's enough role variety to
  justify it)
- Security pass: confirm every route re-checks permission server-side, confirm scraper
  and logs are genuinely Super-Admin-only end to end
- Accessibility pass toward WCAG 2.1 AA
- Geo query performance check under realistic data volume (PostGIS indexing)

**Checkpoint**: Super Admin has full visibility, and a security review doesn't turn up
a UI-only permission check anywhere.

## Phase 9 — Polish & stakeholder review

- e2e test coverage for the primary flows (symptom check → booking, provider
  registration → verification, scraper dedup)
- Resolve any remaining items from `PRD.md` §7 (open assumptions) with stakeholders
- Deployment pipeline finalized
- Documentation pass

---

**Sequencing note**: Phases 2–5 can overlap somewhat once Phase 1 is solid (e.g.
Hospital/Pharmacy/Lab CRUD in Phase 2 doesn't block starting Appointment Booking UI
work), but Phase 6 (Scraper) genuinely needs Phase 2's entity models to dedupe against,
and Phase 7 (Specialty Agents) genuinely needs Phase 2's Doctor module and Phase 3's
Appointment Booking for its referral action — don't parallelize those two.
