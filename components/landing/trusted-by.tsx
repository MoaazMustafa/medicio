"use client";

import {
  Building2,
  Cross,
  Dna,
  FlaskConical,
  HeartPulse,
  Hospital,
  Microscope,
  Pill,
} from "lucide-react";

import { FadeUp } from "@/components/landing/motion";
import { Container } from "@/components/landing/primitives";

const ORGANIZATIONS = [
  { icon: Hospital, name: "Northline Health" },
  { icon: Microscope, name: "Helix Diagnostics" },
  { icon: Cross, name: "CarePoint Clinics" },
  { icon: HeartPulse, name: "Vitalis Group" },
  { icon: Building2, name: "BlueOak Hospital" },
  { icon: FlaskConical, name: "MediTrust Labs" },
  { icon: Dna, name: "Aster Family Care" },
  { icon: Pill, name: "Orbit Pharmacy" },
] as const;

function LogoRow() {
  return (
    <>
      {ORGANIZATIONS.map((org) => (
        <span
          key={org.name}
          className="mx-7 inline-flex shrink-0 items-center gap-2.5 text-text-secondary/70 transition-colors duration-300 hover:text-text-primary"
        >
          <org.icon aria-hidden className="h-5 w-5" />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
            {org.name}
          </span>
        </span>
      ))}
    </>
  );
}

export function TrustedBy() {
  return (
    <section aria-label="Organizations using Medicio" className="py-14 md:py-16">
      <Container>
        <FadeUp>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
            Trusted by care teams and clinics of every size
          </p>
        </FadeUp>
        <FadeUp className="marquee-mask mt-8 overflow-hidden" delay={0.1}>
          <div className="marquee-track">
            <LogoRow />
            <span aria-hidden className="contents">
              <LogoRow />
            </span>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
