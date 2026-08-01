"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { Clock, FileCheck2, HeartHandshake, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Stagger, StaggerItem } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const BENEFITS = [
  {
    icon: Clock,
    value: 4,
    suffix: "\u00D7",
    label: "Faster to the right care",
    text: "From \u201cwhat should I do?\u201d to a booked, verified appointment.",
  },
  {
    icon: FileCheck2,
    value: 68,
    suffix: "%",
    label: "Less paperwork",
    text: "Intake, records and follow-ups organized before the visit starts.",
  },
  {
    icon: HeartHandshake,
    value: 92,
    suffix: "%",
    label: "Patient engagement",
    text: "Patients return because guidance is instant and trustworthy.",
  },
  {
    icon: Workflow,
    value: 24,
    suffix: "/7",
    label: "Always-on triage",
    text: "The AI front door never closes — nights, weekends, holidays.",
  },
] as const;

/** Counts from 0 to `target` the first time it enters the viewport. */
function CountUp({ suffix, target }: { suffix: string; target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(target);

      return;
    }
    const controls = animate(0, target, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, reduceMotion, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export function Benefits() {
  return (
    <section className="py-20 md:py-28">
      <Container>
        <SectionHeading
          description="Teams and patients measure the difference in days, not quarters."
          eyebrow="Measurable impact"
          title="Value you can put a number on"
        />

        <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <StaggerItem key={benefit.label} className="h-full">
              <article className="group relative h-full overflow-hidden rounded-2xl border border-border-custom bg-surface/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_24px_48px_-28px_var(--primary)]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                />
                <benefit.icon className="relative h-5 w-5 text-primary" />
                <p className="relative mt-4 text-4xl font-extrabold tracking-tight text-text-primary">
                  <CountUp suffix={benefit.suffix} target={benefit.value} />
                </p>
                <h3 className="relative mt-1.5 text-sm font-bold text-text-primary">
                  {benefit.label}
                </h3>
                <p className="relative mt-2 text-[13px] leading-relaxed text-text-secondary">
                  {benefit.text}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>

        <p className="mt-6 text-center text-[11px] text-text-secondary/70">
          Illustrative outcomes from early partner deployments.
        </p>
      </Container>
    </section>
  );
}
