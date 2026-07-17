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

### Phase 2: Core Platform Infrastructure (In Progress)
- [x] Create project-level developer instructions (`.agents/AGENTS.md`).
- [x] Produce architecture specifications (`schema.md`, `backend.md`, `trd.md`, `memory.md`).
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
