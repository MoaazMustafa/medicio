# Medicio — Engineering Rules

> For anyone (or any AI assistant) writing code in this repo. Grounded in the SRS's
> business rules and non-functional requirements — these aren't style preferences,
> most of them are load-bearing for compliance (NFR-COMP-*) or security (NFR-SEC-*).

## 1. Do

- **Enforce RBAC server-side, on every protected action.** Route handlers and Server
  Actions each re-check the caller's permission before doing anything — a role check
  in the UI is a convenience, never the actual gate (FR-IAM-05, NFR-SEC-02).
- **Route all authorization through `lib/auth`.** One implementation, reused
  everywhere. If a module thinks it needs its own permission logic, that's a sign the
  shared helper is missing a case — extend it, don't fork it.
- **Tag data source explicitly.** Every scraped Doctor/Hospital/Pharmacy/Lab record
  carries a visible `source: SCRAPED` marker all the way to the UI. Never return
  scraped and verified records from the same query without that field present in the
  response (FR-SCRAPE-05).
- **Verified beats scraped, always.** Where a scraped record and a verified record
  describe the same real-world entity, the merge/dedup logic keeps the verified one
  and discards or subordinates the scraped fields (FR-SCRAPE-06).
- **Validate at the boundary.** Every Server Action and Route Handler parses its input
  through a Zod schema before touching the database or an LLM call.
- **Keep modules loosely coupled.** Call another module through its exported service
  functions, not its Prisma models directly. If module A needs data module B owns,
  that's a function call into B, not a join across ownership boundaries.
- **Log every state-changing action.** Writes (not reads) go through a path that also
  appends an `AuditLog` entry — who, what, when, on what record (FR-LOG-01).
- **Show the medical disclaimer wherever AI output appears.** Symptom checker results
  and every Specialty Agent response render the disclaimer — not just on first load
  (FR-AI-10, NFR-COMP-01).
- **Complete mandatory intake before generating a symptom-checker result.** Duration,
  medicines already used, pre-existing conditions, prior treatment approach — all
  required inputs, not optional fields the model can skip (FR-AI-02).
- **Keep scraper work off the request path.** Scraping runs as a background job;
  nothing user-facing waits on it (NFR-PERF-03).
- **Use TypeScript strict mode.** No `any` as a way to skip modeling a type properly.

## 2. Avoid

- **Don't build a second auth path.** No module gets its own bespoke "is this user
  allowed" check that bypasses `lib/auth` — this is explicitly forbidden by the SRS
  (§2.4): "no module may implement a parallel authorization path."
- **Don't expose scraper internals to anyone but Super Admin.** Config, raw scraped
  payloads, and run logs are gated at the route level, not just hidden in the UI
  (FR-SCRAPE-04).
- **Don't let an entity-scoped or specialty AI agent answer outside its bound scope.**
  A Doctor Agent answers about that doctor only; a specialty bot stays in its
  specialty. This needs an explicit scope guard around the LLM call, not just a
  system-prompt instruction (FR-AGENT-02).
- **Don't auto-suggest a doctor visit when the intake doesn't warrant it.** The
  recommendation logic should actively avoid over-referring — this is a stated
  requirement, not just a nice-to-have (FR-AI-06).
- **Don't grant full Doctor registration before credential verification clears.**
  Registration and "fully registered, bookable" are two different states (FR-DOC-02).
- **Don't put LLM API keys or Supabase service-role keys in client code.** Server-only,
  read from environment variables, never bundled.
- **Don't let a hospital's admin override a doctor's own availability.** Hospital
  Admins can view/manage a hospital-affiliated doctor's listed details, but the
  availability calendar itself stays doctor-controlled (FR-DOC-04, FR-HOSP-03).
- **Don't silently swallow LLM/provider failures.** If the AI provider is down,
  surface a clear "temporarily unavailable" state — don't return an empty or
  malformed result (NFR-REL-02).
- **Don't skip the patient-ID match when attaching a lab report.** Reports only attach
  to the patient portal via explicit ID matching, never fuzzy name matching
  (FR-PORTAL-02).

## 3. Library choices

Picked to fit the existing stack (Next.js, TypeScript, Tailwind, Prisma, Supabase,
PostgreSQL) — no new infra family introduced without a reason.

| Concern | Library | Notes |
| --- | --- | --- |
| Validation | `zod` | Single schema shared between client form and server action |
| Forms | `react-hook-form` + `@hookform/resolvers/zod` | — |
| Server state / caching | `@tanstack/react-query` | For client-fetched data (dashboards, search) |
| Auth | Supabase Auth | Session/identity only — role/permission resolution stays in your own tables |
| LLM integration | Vercel AI SDK | Provider-agnostic; streaming for the symptom-checker chat UI |
| Geospatial | PostGIS (Supabase) | Required once radius search volume grows past a trivial dataset (NFR-SCALE-02) |
| Background jobs | Inngest, trigger.dev, or Supabase scheduled Edge Functions | Any of these satisfies "async, off the request path" — pick one early, don't mix two |
| Analytics | `posthog-js` (client) / `posthog-node` (server) | Named directly in FR-LOG-03 |
| Testing | `vitest`, `@playwright/test` | Unit/integration + e2e |
| Date/time | `date-fns` | Availability calendars, appointment scheduling |

## 4. Error handling

- **One error envelope shape** across every API surface:
  ```ts
  { error: { code: string; message: string } }
  ```
- **Map errors to the right status honestly** — 400 (validation), 401 (no session),
  403 (authenticated but not permitted), 404 (not found or not visible to this role —
  don't leak existence of records a role can't see), 500 (unexpected).
- **Never leak internals to the client.** Stack traces, Prisma error messages, and raw
  LLM provider errors get logged server-side and translated to a generic message for
  the response.
- **Wrap route handlers in a shared error boundary** so every module gets consistent
  handling without reimplementing try/catch per route.
- **LLM calls need explicit timeout + fallback handling**, not just a try/catch — a
  hung symptom-checker request is a worse UX than a fast, honest failure message
  (NFR-REL-02, NFR-PERF-01).

## 5. AI boundaries

These apply to both in-product AI features (Symptom Checker, Specialty Agents) and to
any AI coding assistant working in this repo.

**For the product's AI features:**

- Advisory only — never phrase output as a diagnosis. The disclaimer isn't optional
  copy, it's a compliance requirement (NFR-COMP-01).
- Mandatory intake fields gate result generation — no shortcutting straight to an
  answer.
- Suggested medicine is cross-checked against the patient's disclosed conditions and
  medicine history before it's shown (FR-AI-03).
- Every AI-generated suggestion is retained in an auditable log for accountability
  (NFR-COMP-03).
- Specialty-agent training data (real doctor consultation data) needs consent/
  anonymization handling before it's used — this is an explicitly open compliance item
  in the SRS, not yet resolved. Don't wire up real consultation data as training input
  until that's settled.

**For an AI assistant building this codebase:**

- Treat the RBAC and data-source-tagging rules above as hard constraints, not
  suggestions to weigh against convenience — they're the two rules most load-bearing
  for the platform's actual compliance posture.
- When the SRS's "Open Notes" section for a module hasn't been resolved (see `PRD.md`
  §7), don't silently pick an interpretation and build against it — flag it back to
  the person before writing the code that depends on it.
- Don't invent scope beyond what's in `PRD.md`. Payments, telemedicine, and mobile-
  native are explicitly out of scope for this revision.
