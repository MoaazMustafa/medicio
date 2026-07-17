---
version: "medicio-v1-healthcare"
name: "Medicio - AI-Powered Healthcare Access Platform"
description: "Medicio is an AI-driven clinical portal connecting patients with verified doctors, hospitals, labs, and pharmacies. The design prioritizes visual clarity, clean data density, and reassuring clinical themes."
colors:
  dark:
    primary: "#2DD4BF"
    secondary: "#191C21"
    accent: "#14B8A6"
    background: "#030108"
    surface: "#191C21"
    text-primary: "#FFFFFF"
    text-secondary: "#A1A1AA"
    border: "#27272A"
  light:
    primary: "#0D9488"
    secondary: "#F3F4F6"
    accent: "#0F766E"
    background: "#F9FAFB"
    surface: "#FFFFFF"
    text-primary: "#111827"
    text-secondary: "#4B5563"
    border: "#E5E7EB"
typography:
  display-lg:
    fontFamily: "Inter"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: "1.04"
    letterSpacing: "0"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  label-md:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "1.2"
spacing:
  base: "8px"
  gap: "16px"
  card-padding: "24px"
  section-padding: "80px"
rounded:
  card: "8px"
  control: "8px"
  pill: "9999px"
components:
  card:
    background: "Use the surface token with subtle borders and HTML-matched shadow depth"
    radius: "Match the declared card radius token"
  button:
    background: "Use primary or accent colors for the main action"
    radius: "Use the control or pill radius based on the source HTML"
---
# Medicio - AI-Powered Healthcare Access Platform
Source: Medicio Project Specifications. Prepared by Moaaz Mustafa. Version: 1.0.
Tags: healthcare, ai-agents, symptom-checker, doctor-booking, bento, charts, clinical, nextjs, heroui.
## Overview
Medicio is an AI-powered healthcare portal. It is designed to host a conversational symptom checker and patient intake flow, clinical dashboards for doctors, hospital affiliation managers, lab report trackers, and scraped public medical directories. Key user interfaces require reassuring aesthetics, high legibility, structured clinical data cards, and visual responsiveness.

Key visible sections include: Conversational AI Intake, Doctor Specializations list, Active Clinic Directory, Patient Health Records, and Lab Reports list.
## Colors
Anchor the palette in:
- Dark: primary #2DD4BF, secondary #191C21, accent #14B8A6, background #030108, surface #191C21, text-primary #FFFFFF, text-secondary #A1A1AA, border #27272A.
- Light: primary #0D9488, secondary #F3F4F6, accent #0F766E, background #F9FAFB, surface #FFFFFF, text-primary #111827, text-secondary #4B5563, border #E5E7EB.
Keep background, surface, text, and border roles distinct so generated layouts retain the same contrast pattern as the source.
## Typography
Use Inter for display moments and Inter for body copy unless the HTML clearly demands a compatible fallback. Labels and technical metadata should use JetBrains Mono or an equivalent mono face.
## Layout
Keep spacing deliberate and stable. Favor the same grid direction, max-width behavior, card density, and responsive stacking seen in the HTML. Do not replace distinctive source structures with generic SaaS sections.
## Components
Dashboard, chart, and data panels should preserve their compact operational hierarchy, nested surfaces, and metric emphasis.
## Motion
Preserve existing motion cues such as masked reveals, staggered entrance, hover lift, scroll-triggered transitions, and ambient movement. Keep easing smooth and restrained.
## WebGL & Effects

If the source includes canvas, WebGL, Three.js, gradients, particles, or atmospheric effects, rebuild them as supporting layers behind the content. Keep effects performant, responsive, and secondary to the interface.

## Guardrails
- Do not flatten the source into a generic card grid.
- Do not swap the color mode unless the source clearly supports it.
- Preserve the first viewport signal, focal object, and visual density.
- Keep buttons, cards, and badges aligned to the same radius and border language.