"use client";

import { Check, Sparkles, X } from "lucide-react";

import { FadeUp } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const OLD_WAY = [
  "Hours searching directories with no idea who's legitimate",
  "Phone-tag booking, waiting rooms and lost referrals",
  "Records scattered across clinics, PDFs and paper files",
  "Generic internet advice with zero personal context",
  "No follow-up once you walk out the door",
] as const;

const MEDICIO_WAY = [
  "Guided AI triage with a clear severity level in minutes",
  "Real published slots, booked in two taps — verified-first",
  "One portal for labs, medicines, visits and reports",
  "Advice informed by your history, meds and prior triages",
  "Automated follow-ups, reminders and synced results",
] as const;

export function Comparison() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-spot left-[40%] top-[30%] h-96 w-96 bg-primary/10" />
      </div>

      <Container className="relative">
        <SectionHeading
          description="Healthcare access hasn't changed in decades. Medicio replaces the scramble with a single guided flow."
          eyebrow="Why Medicio"
          title="Retire the old way of finding care"
        />

        <div className="relative mx-auto mt-12 grid max-w-4xl gap-5 md:mt-16 md:grid-cols-2 md:gap-6">
          {/* VS divider */}
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block"
          >
            <span className="glass flex h-12 w-12 items-center justify-center rounded-full text-xs font-extrabold uppercase tracking-wide text-text-secondary shadow-lg">
              vs
            </span>
          </div>

          {/* Old way */}
          <FadeUp className="h-full">
            <div className="h-full rounded-3xl border border-border-custom bg-surface/40 p-7 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                Traditional workflow
              </p>
              <h3 className="mt-2 text-lg font-bold text-text-secondary">
                Finding care today
              </h3>
              <ul className="mt-6 flex flex-col gap-4">
                {OLD_WAY.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-text-secondary/10">
                      <X className="h-3 w-3 text-text-secondary/70" />
                    </span>
                    <span className="text-[13px] leading-relaxed text-text-secondary">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>

          {/* Medicio way */}
          <FadeUp className="h-full" delay={0.12}>
            <div className="relative h-full overflow-hidden rounded-3xl border border-primary/30 bg-surface p-7 shadow-[0_30px_70px_-40px_var(--primary)] sm:p-8">
              <div
                aria-hidden
                className="glow-spot -right-14 -top-14 h-48 w-48 bg-primary/20"
              />
              <p className="relative flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                With Medicio
              </p>
              <h3 className="relative mt-2 text-lg font-bold text-text-primary">
                One guided, verified flow
              </h3>
              <ul className="relative mt-6 flex flex-col gap-4">
                {MEDICIO_WAY.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Check className="h-3 w-3 text-primary" />
                    </span>
                    <span className="text-[13px] font-medium leading-relaxed text-text-primary">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </FadeUp>
        </div>
      </Container>
    </section>
  );
}
