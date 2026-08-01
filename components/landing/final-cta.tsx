"use client";

import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { FadeUp } from "@/components/landing/motion";
import { ButtonLink, Container } from "@/components/landing/primitives";

export function FinalCta() {
  return (
    <section className="pb-24 pt-6 md:pb-32">
      <Container>
        <FadeUp>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#05080d] px-6 py-16 text-center sm:px-12 md:py-24">
            {/* Animated halo + glow backdrop */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="cta-halo absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 opacity-30" />
              <div className="absolute inset-[3px] rounded-[calc(2.5rem-3px)] bg-[#05080d]" />
              <div className="glow-spot left-[20%] top-[-30%] h-72 w-72 bg-teal-500/25" />
              <div className="glow-spot bottom-[-40%] right-[15%] h-80 w-80 bg-cyan-500/20" />
              <div className="bg-dots-fade absolute inset-0 opacity-40" />
            </div>

            <div className="relative flex flex-col items-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5 text-xs font-semibold text-teal-300">
                <Sparkles className="h-3.5 w-3.5" />
                Free for patients, forever
              </span>

              <h2 className="mt-6 max-w-2xl text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
                Take the guesswork out of your next health decision
              </h2>

              <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 md:text-base">
                Join Medicio and go from first symptom to verified, booked care
                in minutes — with your whole health story in one place.
              </p>

              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
                <ButtonLink href="/register" icon={ArrowRight}>
                  Create your free account
                </ButtonLink>
                <ButtonLink href="/chatbot" variant="ghost-dark">
                  Try the symptom checker
                </ButtonLink>
              </div>

              <p className="mt-7 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                Role-guarded privacy · Advisory AI only · No credit card required
              </p>
            </div>
          </div>
        </FadeUp>
      </Container>
    </section>
  );
}
