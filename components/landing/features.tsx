"use client";

import {
  BarChart3,
  Bot,
  CalendarCheck,
  FolderHeart,
  Lock,
  Pill,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Stagger, StaggerItem } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const FEATURES = [
  {
    icon: Stethoscope,
    title: "AI Symptom Checker",
    text: "Conversational triage that turns \u201cwhat should I do?\u201d into a clear severity level and a concrete next step.",
  },
  {
    icon: Bot,
    title: "Specialty AI Agents",
    text: "Assistants scoped to a single doctor, facility or specialty — so every answer stays on topic and in context.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Provider Network",
    text: "Doctors pass credential verification before appearing as verified — and always rank above unverified listings.",
  },
  {
    icon: CalendarCheck,
    title: "Smart Scheduling",
    text: "Search by specialty, availability and proximity, then book directly against real published time slots.",
  },
  {
    icon: Pill,
    title: "Medicine Tracker",
    text: "Log doses and schedules. Your medicine history feeds the symptom checker so advice accounts for it.",
  },
  {
    icon: FolderHeart,
    title: "Unified Health Records",
    text: "Lab reports, prescriptions, appointments and consultations — one portal you control and carry with you.",
  },
  {
    icon: BarChart3,
    title: "Provider Analytics",
    text: "Bookings, utilization and patient-flow insights for doctors, hospitals, labs and pharmacies.",
  },
  {
    icon: Lock,
    title: "Private by Design",
    text: "Strict role-guarded access on every record. Your health data is visible only to those you allow.",
  },
] as const;

export function Features() {
  return (
    <section className="relative scroll-mt-28 py-20 md:py-28" id="features">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-spot left-[8%] top-[20%] h-72 w-72 bg-primary/10" />
        <div className="glow-spot bottom-[10%] right-[6%] h-72 w-72 bg-accent/10" />
      </div>

      <Container className="relative">
        <SectionHeading
          description="Every tool a modern health journey needs — for patients and the entire provider network — built on one strictly role-guarded platform."
          eyebrow="Core features"
          title="A complete operating system for everyday care"
        />

        <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <StaggerItem key={feature.title} className="h-full">
              <article className="group relative h-full overflow-hidden rounded-2xl border border-border-custom bg-surface/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_24px_48px_-28px_var(--primary)]">
                {/* Hover spotlight */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary/15 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white dark:group-hover:text-slate-950">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="relative mt-4 text-[15px] font-bold text-text-primary">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-[13px] leading-relaxed text-text-secondary">
                  {feature.text}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
