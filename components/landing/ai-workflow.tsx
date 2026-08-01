"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  BrainCircuit,
  CalendarCheck,
  ClipboardList,
  MessageSquareText,
  Route,
} from "lucide-react";
import { useRef } from "react";

import { EASE } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Patient describes symptoms",
    text: "A conversational intake collects symptoms, duration, medicines tried and pre-existing conditions — in plain language.",
    detail: "\u201cDry cough and mild fever since Monday…\u201d",
  },
  {
    icon: BrainCircuit,
    title: "AI processing",
    text: "The engine weighs severity signals against the patient's medicine history and prior triages for real context.",
    detail: "Analyzing 14 signals · history included",
  },
  {
    icon: ClipboardList,
    title: "Medical insights",
    text: "A clear severity level and possible conditions — always advisory, always paired with a medical disclaimer.",
    detail: "Severity: Moderate · viral URI likely",
  },
  {
    icon: Route,
    title: "Recommendations",
    text: "Self-care guidance, or matched verified doctors, labs and pharmacies nearby — ranked verified-first.",
    detail: "3 verified GPs within 3 km",
  },
  {
    icon: CalendarCheck,
    title: "Clinical decision",
    text: "The patient books a real slot; the doctor sees the full intake and record before the visit even starts.",
    detail: "Booked · Dr. Rahman · today 5:40 PM",
  },
] as const;

export function AiWorkflow() {
  const lineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: lineRef,
    offset: ["start 0.75", "end 0.55"],
  });
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="relative scroll-mt-28 overflow-hidden py-20 md:py-28" id="workflow">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-spot right-[12%] top-[8%] h-80 w-80 bg-primary/10" />
      </div>

      <Container className="relative">
        <SectionHeading
          description="Five steps, one continuous flow — from the first message to a confirmed clinical decision."
          eyebrow="How it works"
          title="From symptom to decision, without the guesswork"
        />

        <div ref={lineRef} className="relative mx-auto mt-14 max-w-3xl lg:mt-20">
          {/* Track + animated progress line */}
          <div
            aria-hidden
            className="absolute bottom-4 left-[22px] top-4 w-px bg-border-custom sm:left-1/2"
          />
          <motion.div
            aria-hidden
            className="absolute bottom-4 left-[22px] top-4 w-px origin-top bg-gradient-to-b from-primary to-accent sm:left-1/2"
            style={{ scaleY }}
          />

          <ol className="flex flex-col gap-10 sm:gap-14">
            {STEPS.map((step, index) => {
              const onLeft = index % 2 === 0;

              return (
                <li key={step.title} className="relative">
                  {/* Node */}
                  <motion.span
                    className="absolute left-0 top-0 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-background-custom shadow-[0_0_24px_-6px_var(--primary)] sm:left-1/2 sm:-translate-x-1/2"
                    initial={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    viewport={{ once: true, margin: "-100px" }}
                    whileInView={{ scale: 1, opacity: 1 }}
                  >
                    <step.icon className="h-4.5 w-4.5 text-primary" />
                  </motion.span>

                  {/* Card */}
                  <motion.div
                    className={`ml-16 sm:ml-0 sm:w-[calc(50%-3rem)] ${
                      onLeft ? "sm:mr-auto sm:text-right" : "sm:ml-auto"
                    }`}
                    initial={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                    viewport={{ once: true, margin: "-100px" }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <div className="group rounded-2xl border border-border-custom bg-surface/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_44px_-28px_var(--primary)] sm:p-6">
                      <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                        Step {index + 1}
                      </span>
                      <h3 className="mt-1.5 text-[15px] font-bold text-text-primary">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                        {step.text}
                      </p>
                      <p
                        className={`mt-3 inline-block rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-primary`}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
