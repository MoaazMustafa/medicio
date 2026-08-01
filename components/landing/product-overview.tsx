"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarCheck,
  FileText,
  FolderHeart,
  MapPin,
  MessagesSquare,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

import { EASE, FadeUp } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const PILLARS = [
  {
    id: "understand",
    icon: MessagesSquare,
    title: "Understand what's wrong",
    text: "Describe symptoms in plain language. The AI collects duration, medicines tried and history, then returns a clear severity level and next step.",
  },
  {
    id: "connect",
    icon: ShieldCheck,
    title: "Connect to verified care",
    text: "Credential-verified doctors, hospitals, labs and pharmacies near you — always ranked above unverified listings, bookable in two taps.",
  },
  {
    id: "organize",
    icon: FolderHeart,
    title: "Keep everything in one record",
    text: "Lab reports, prescriptions, appointments and consultations consolidated into one portal that you control and carry between providers.",
  },
] as const;

type PillarId = (typeof PILLARS)[number]["id"];

/* ------------------------- Visual panels per pillar ------------------------ */

function UnderstandVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6 sm:p-8">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Bot className="h-4 w-4 text-primary" />
        </span>
        <div className="rounded-2xl rounded-tl-sm border border-border-custom bg-surface px-4 py-3 text-xs leading-relaxed text-text-secondary">
          How long have you had the headaches, and do they wake you at night?
        </div>
      </div>
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-xs text-white dark:text-slate-950">
          About two weeks. Mostly mornings.
        </div>
      </div>
      <div className="glass rounded-2xl p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          AI assessment
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            Severity: Moderate
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            Tension-type likely
          </span>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            GP visit recommended
          </span>
        </div>
      </div>
    </div>
  );
}

function ConnectVisual() {
  const providers = [
    { name: "Dr. Sana Karim", specialty: "Neurologist", distance: "0.8 km", verified: true },
    { name: "BlueOak Hospital", specialty: "Multi-specialty", distance: "2.1 km", verified: true },
    { name: "City Health Clinic", specialty: "General practice", distance: "3.4 km", verified: false },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-text-secondary">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Care near Dhanmondi, ranked verified-first
      </div>
      {providers.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-3 rounded-2xl border border-border-custom bg-surface px-4 py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25">
            <Stethoscope className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
              {p.name}
              {p.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                  <ShieldCheck className="h-2.5 w-2.5" /> Verified
                </span>
              ) : (
                <span className="rounded-full bg-text-secondary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-secondary">
                  Unverified
                </span>
              )}
            </p>
            <p className="text-[11px] text-text-secondary">
              {p.specialty} · {p.distance}
            </p>
          </div>
          <CalendarCheck className="h-4 w-4 shrink-0 text-text-secondary/60" />
        </div>
      ))}
    </div>
  );
}

function OrganizeVisual() {
  const records = [
    { icon: FileText, title: "CBC Lab Report", meta: "Helix Diagnostics · Tue", tint: "text-sky-500 bg-sky-500/15" },
    { icon: Pill, title: "Amoxicillin 500mg", meta: "3× daily · 4 days left", tint: "text-emerald-500 bg-emerald-500/15" },
    { icon: CalendarCheck, title: "Follow-up · Dr. Karim", meta: "Fri 10:30 AM · Confirmed", tint: "text-primary bg-primary/15" },
    { icon: Sparkles, title: "AI summary updated", meta: "Includes latest lab results", tint: "text-violet-500 bg-violet-500/15" },
  ];

  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-6 sm:p-8">
      {records.map((r) => (
        <div
          key={r.title}
          className="flex items-center gap-3 rounded-2xl border border-border-custom bg-surface px-4 py-3"
        >
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${r.tint}`}>
            <r.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text-primary">{r.title}</p>
            <p className="truncate text-[11px] text-text-secondary">{r.meta}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const VISUALS: Record<PillarId, ComponentType> = {
  understand: UnderstandVisual,
  connect: ConnectVisual,
  organize: OrganizeVisual,
};

/* --------------------------------- Section -------------------------------- */

export function ProductOverview() {
  const [active, setActive] = useState<PillarId>("understand");
  const ActiveVisual = VISUALS[active];

  return (
    <section className="scroll-mt-28 py-20 md:py-28" id="product">
      <Container>
        <SectionHeading
          description="One account connects AI triage, verified providers and your complete health history — for patients and the entire care network."
          eyebrow="What Medicio does"
          title="Your entire health journey, in one intelligent flow"
        />

        <div className="mt-12 grid items-stretch gap-6 lg:mt-16 lg:grid-cols-[1fr_1.15fr]">
          {/* Selector cards */}
          <div aria-label="Product pillars" className="flex flex-col gap-3" role="tablist">
            {PILLARS.map((pillar, index) => {
              const selected = pillar.id === active;

              return (
                <FadeUp key={pillar.id} delay={index * 0.08}>
                  <button
                    aria-controls="pillar-panel"
                    aria-selected={selected}
                    className={`group w-full rounded-2xl border p-5 text-left transition-all duration-300 sm:p-6 ${
                      selected
                        ? "border-primary/40 bg-surface shadow-[0_16px_40px_-24px_var(--primary)]"
                        : "border-border-custom bg-surface/40 hover:border-primary/25 hover:bg-surface/70"
                    }`}
                    role="tab"
                    type="button"
                    onClick={() => setActive(pillar.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                          selected
                            ? "bg-primary text-white dark:text-slate-950"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <pillar.icon className="h-4.5 w-4.5" />
                      </span>
                      <h3 className="text-[15px] font-bold text-text-primary">
                        {pillar.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                      {pillar.text}
                    </p>
                  </button>
                </FadeUp>
              );
            })}
          </div>

          {/* Animated visual panel */}
          <FadeUp className="min-h-[380px]" delay={0.15}>
            <div
              aria-label="Selected pillar preview"
              className="glass relative h-full overflow-hidden rounded-3xl"
              id="pillar-panel"
              role="tabpanel"
            >
              <div
                aria-hidden
                className="glow-spot -right-16 -top-16 h-56 w-56 bg-primary/20"
              />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full"
                  exit={{ opacity: 0, y: -12 }}
                  initial={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <ActiveVisual />
                </motion.div>
              </AnimatePresence>
            </div>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
