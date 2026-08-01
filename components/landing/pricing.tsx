"use client";

import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";

import { Stagger, StaggerItem } from "@/components/landing/motion";
import { ButtonLink, Container, SectionHeading } from "@/components/landing/primitives";

interface Plan {
  name: string;
  audience: string;
  monthly: number | null;
  annual: number | null;
  priceNote: string;
  features: string[];
  cta: { label: string; href: string };
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Patient",
    audience: "For individuals and families",
    monthly: 0,
    annual: 0,
    priceNote: "Free forever",
    features: [
      "Unlimited AI symptom checks",
      "Verified doctor, lab & pharmacy search",
      "Appointment booking",
      "Medicine tracker & reminders",
      "Unified health records",
    ],
    cta: { label: "Create free account", href: "/register" },
  },
  {
    name: "Practice",
    audience: "For doctors and small clinics",
    monthly: 49,
    annual: 39,
    priceNote: "per provider / month",
    features: [
      "Everything in Patient",
      "Verified provider profile & badge",
      "Self-managed availability & bookings",
      "Personal specialty AI agent",
      "Patient-flow analytics",
      "Priority support",
    ],
    cta: { label: "Start 14-day trial", href: "/register" },
    recommended: true,
  },
  {
    name: "Network",
    audience: "For hospitals, labs & pharmacy chains",
    monthly: null,
    annual: null,
    priceNote: "Custom pricing",
    features: [
      "Everything in Practice",
      "Facility profiles & affiliations",
      "Lab catalogues & report delivery",
      "Pharmacy inventory sync",
      "Role-based admin controls",
      "Dedicated onboarding",
    ],
    cta: { label: "Talk to us", href: "/register" },
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="relative scroll-mt-28 overflow-hidden py-20 md:py-28" id="pricing">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-spot left-[10%] top-[15%] h-80 w-80 bg-primary/10" />
        <div className="glow-spot bottom-[5%] right-[8%] h-80 w-80 bg-accent/10" />
      </div>

      <Container className="relative">
        <SectionHeading
          description="Free for every patient, forever. Providers pay only for the tools that grow their practice."
          eyebrow="Pricing preview"
          title="Simple pricing for the whole care network"
        />

        {/* Billing toggle */}
        <div className="mt-8 flex justify-center">
          <div className="glass inline-flex items-center rounded-full p-1">
            {[
              { label: "Monthly", value: false },
              { label: "Annual · save 20%", value: true },
            ].map((option) => (
              <button
                key={option.label}
                aria-pressed={annual === option.value}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                  annual === option.value
                    ? "bg-primary text-white shadow-md dark:text-slate-950"
                    : "text-text-secondary hover:text-text-primary"
                }`}
                type="button"
                onClick={() => setAnnual(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Stagger className="mt-10 grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 lg:mt-12">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;

            return (
              <StaggerItem key={plan.name} className="h-full">
                <article
                  className={`relative flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 sm:p-8 ${
                    plan.recommended
                      ? "border-primary/40 bg-surface shadow-[0_36px_80px_-44px_var(--primary)] md:-translate-y-3"
                      : "border-border-custom bg-surface/50 hover:border-primary/25"
                  }`}
                >
                  {plan.recommended ? (
                    <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg dark:text-slate-950">
                      <Sparkles className="h-3 w-3" />
                      Recommended
                    </span>
                  ) : null}

                  <h3 className="text-base font-bold text-text-primary">{plan.name}</h3>
                  <p className="mt-1 text-xs text-text-secondary">{plan.audience}</p>

                  <div className="mt-5 flex items-baseline gap-1.5">
                    {price === null ? (
                      <span className="text-4xl font-extrabold tracking-tight text-text-primary">
                        Custom
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold tracking-tight text-text-primary">
                          ${price}
                        </span>
                        {price > 0 ? (
                          <span className="text-xs text-text-secondary">/mo</span>
                        ) : null}
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-text-secondary">
                    {plan.priceNote}
                  </p>

                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                          <Check className="h-2.5 w-2.5 text-primary" />
                        </span>
                        <span className="text-[13px] leading-relaxed text-text-secondary">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7">
                    <ButtonLink
                      className="w-full"
                      href={plan.cta.href}
                      icon={plan.recommended ? ArrowRight : undefined}
                      size="md"
                      variant={plan.recommended ? "primary" : "secondary"}
                    >
                      {plan.cta.label}
                    </ButtonLink>
                  </div>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>

        <p className="mt-8 text-center text-[11px] text-text-secondary/70">
          Preview pricing — final plans announced at general availability.
        </p>
      </Container>
    </section>
  );
}
