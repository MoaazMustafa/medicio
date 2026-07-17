# Antigravity Rules for Medicio Repository

You MUST follow these constraints and instructions at all times when working in this codebase:

## 1. Documentation Integrity
- **Mandatory Read:** Before making any code modification, adding new files, running databases migrations, or altering existing setups, you MUST read the following documentation files in full to align on architecture, theme colors, and data schemas:
  - [srs.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/srs.md) or [Medicio_SRS_v1_0.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/Medicio_SRS_v1_0.md) (Platform specifications)
  - [design.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/design.md) (Design system and theme color tokens)
  - [schema.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/schema.md) (Prisma database schema specifications)
  - [backend.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/backend.md) (API controller endpoints, RBAC permissions, background jobs)
  - [trd.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/trd.md) (Architecture boundaries and tech stack)
  - [memory.md](file:///c:/Users/conta/OneDrive/Desktop/medicio/medicio/memory.md) (Roadmap history and current context state)

## 2. UI Component Constraints (HeroUI Priority)
- **Always use HeroUI (@heroui/react) components:** When adding pages, sidebars, buttons, text fields, inputs, cards, dropdowns, headers, tables, or modals, you MUST use the corresponding components provided by the HeroUI library.
- **Do not use native HTML interactive tags:** Avoid raw `<button>`, `<input>`, `<select>`, `<header>`, or `<table>` tags. Instead, import and use `<Button>`, `<Input>`, `<Select>`, `<Card>`, etc. from `@heroui/react`.
- **Maintain design system values:** Ensure that all components adhere strictly to the Light/Dark theme color tokens specified in `design.md` and `styles/globals.css`.
