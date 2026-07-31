# Medicio Project Memory & Roadmap

This document serves as a persistent context log for AI agents working on the Medicio codebase, outlining previous phases, design constraints, and next steps.

---

## Roadmap & Status

### Phase 1: Configuration & Environment Setup (Completed)
- Cleaned up Next.js boilerplate templates.
- Imported ESLint 9 configs (`eslint.config.mjs`) and Prettier rules.
- Set up Tailwind CSS v4 design variables and view transition utilities.
- Integrated `ClickSpark` canvas clicks and circular revealing `ThemeSwitch`.
- Initialized Prisma ORM and configured PostgreSQL database models.

### Phase 2: Core Platform Infrastructure & Entity Management (In Progress)
- [x] Create project-level developer instructions (`.agents/AGENTS.md`).
- [x] Produce architecture specifications (`schema.md`, `backend.md`, `trd.md`, `memory.md`).
- [x] **M4 — Doctor Management (Completed)**:
  - Doctor registration & credential submission (`FR-DOC-01`).
  - Restricted full registration & admin credential verification queue (`FR-DOC-02`).
  - Doctor-controlled availability schedule timetable (`FR-DOC-03`, `FR-DOC-04`).
  - Bidirectional hospital affiliation request management (`FR-DOC-05`).
  - Standalone clinic profiles for independent practitioners (`FR-DOC-06`).
  - Scraped record integration with priority verified badges (`FR-DOC-07`).
  - Personal Specialty AI Agent emergency question set trainer (`FR-DOC-08`).
  - Doctor appointment status management (`FR-DOC-09`).
- [ ] Simplify navigation headers (`components/navbar.tsx`) to strictly use HeroUI components.
- [ ] Update landing pages (`app/page.tsx`, `app/not-found.tsx`, `app/error.tsx`) to match Medicio clinical motifs and enforce HeroUI usage.

### Phase 3: IAM Authentication & RBAC APIs
- Build user sign-up/sign-in flows.
- Implement API middleware for role checking (Super Admin, Doctor, Labs Admin, Patient).

### Phase 4: AI Symptom Checker & Specialty Bots
- Integrate LLM endpoint.
- Develop conversational intake card UI.

---

## Architectural Guidelines
1. **HeroUI Priority**: All interactive elements (Inputs, Buttons, Dropdowns, Cards, Navbars) must be imported from `@heroui/react`. Avoid native HTML elements (e.g. `<button>`, `<input>`).
2. **Theme Coordination**: Maintain Light/Dark modes, mapping colors to tokens in `design.md` via Tailwind variables in `styles/globals.css`.
3. **Database Rules**: Never write raw queries; database interactions must run through Prisma client handlers.
