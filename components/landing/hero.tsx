"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarCheck,
  HeartPulse,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { EASE } from "@/components/landing/motion";
import { ButtonLink, Container } from "@/components/landing/primitives";

const SYMPTOM_SUGGESTIONS = [
  "I've had a dry cough and mild fever for 3 days…",
  "Sharp pain in my lower back when I bend over…",
  "My child has a rash that appeared overnight…",
  "Recurring headaches, worse in the morning…",
] as const;

/** Rotating placeholder for the symptom demo input. */
function useRotatingPlaceholder(paused: boolean) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % SYMPTOM_SUGGESTIONS.length),
      3600,
    );

    return () => clearInterval(timer);
  }, [paused]);

  return SYMPTOM_SUGGESTIONS[index];
}

/** Interactive symptom-search demo — submits into the real chatbot. */
function SymptomDemo() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const placeholder = useRotatingPlaceholder(Boolean(reduceMotion) || focused);

  return (
    <form
      className="glass group relative flex w-full max-w-xl items-center gap-2 rounded-full p-2 pl-5 shadow-[0_18px_50px_-24px_rgba(13,148,136,0.5)] transition-shadow duration-300 focus-within:shadow-[0_18px_60px_-20px_rgba(13,148,136,0.65)]"
      onSubmit={(event) => {
        event.preventDefault();
        router.push("/chatbot");
      }}
    >
      <Search aria-hidden className="h-4 w-4 shrink-0 text-text-secondary" />
      <input
        aria-label="Describe your symptoms"
        className="h-10 w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary/80"
        placeholder={placeholder}
        type="text"
        value={value}
        onBlur={() => setFocused(false)}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocused(true)}
      />
      <button
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-[13px] font-semibold text-white transition-all duration-300 hover:brightness-110 active:scale-[0.97] dark:text-slate-950"
        type="submit"
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Check symptoms</span>
        <span className="sm:hidden">Check</span>
      </button>
    </form>
  );
}

/** Floating decorative UI chip anchored around the product preview. */
function FloatingChip({
  className,
  float = "float-slow",
  children,
}: {
  className: string;
  float?: "float-slow" | "float-medium";
  children: React.ReactNode;
}) {
  return (
    <div aria-hidden className={`pointer-events-none absolute z-20 hidden lg:block ${className}`}>
      <div className={float}>
        <div className="glass flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Hand-built product preview: triage chat + booking panel. */
function HeroPreview() {
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-2 shadow-2xl shadow-primary/10">
      <div className="rounded-2xl border border-border-custom bg-background-custom/90">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border-custom px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 hidden rounded-md border border-border-custom bg-surface px-2.5 py-0.5 text-[10px] font-medium text-text-secondary sm:inline">
            medicio.health/chatbot
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
            AI triage active
          </span>
        </div>

        <div className="grid gap-0 md:grid-cols-[1.25fr_1fr]">
          {/* Chat side */}
          <div className="flex flex-col gap-3 p-4 sm:p-6">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-border-custom bg-surface px-3.5 py-2.5 text-left text-xs leading-relaxed text-text-secondary">
                Hi! Tell me what you&apos;re feeling — I&apos;ll assess severity
                and point you to the right care.
              </div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-left text-xs leading-relaxed text-white dark:text-slate-950">
                Dry cough and mild fever since Monday. Took paracetamol, no
                change.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </span>
              <div className="flex-1 rounded-2xl rounded-tl-sm border border-border-custom bg-surface px-3.5 py-2.5 text-left">
                <p className="text-xs leading-relaxed text-text-secondary">
                  Likely a viral upper-respiratory infection.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                    Severity: Moderate
                  </span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    See a GP within 48h
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking side */}
          <div className="hidden flex-col gap-2.5 border-l border-border-custom bg-surface/60 p-4 sm:p-6 md:flex">
            <p className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
              Verified GPs near you
            </p>
            {[
              { name: "Dr. Ayesha Rahman", meta: "GP · 1.2 km · 4.9", slot: "Today 5:40 PM" },
              { name: "Dr. Omar Siddiqui", meta: "GP · 2.8 km · 4.8", slot: "Tomorrow 10:00 AM" },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-3 rounded-xl border border-border-custom bg-background-custom px-3 py-2.5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-1 truncate text-xs font-semibold text-text-primary">
                    {doc.name}
                    <ShieldCheck className="h-3 w-3 shrink-0 text-primary" />
                  </p>
                  <p className="truncate text-[10px] text-text-secondary">{doc.meta}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {doc.slot}
                </span>
              </div>
            ))}
            <button
              className="mt-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-semibold text-white transition hover:brightness-110 dark:text-slate-950"
              tabIndex={-1}
              type="button"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              Book appointment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="glow-spot left-[-12%] top-[-18%] h-[480px] w-[480px] bg-primary/25" />
        <div className="glow-spot right-[-10%] top-[-6%] h-[420px] w-[420px] bg-accent/20" />
        <div className="glow-spot bottom-[-30%] left-[30%] h-[420px] w-[520px] bg-primary/15" />
        <div className="bg-dots-fade absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background-custom" />
      </div>

      <Container className="relative flex flex-col items-center pb-20 pt-28 text-center md:pb-28 md:pt-36">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            The AI front door to real healthcare
          </span>
        </motion.div>

        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-4xl text-balance text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-text-primary sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 26 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
        >
          From first symptom to the{" "}
          <span className="text-gradient-primary">right care</span> — in
          minutes.
        </motion.h1>

        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-text-secondary md:text-lg"
          initial={{ opacity: 0, y: 22 }}
          transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
        >
          Medicio&apos;s AI triages your symptoms, then connects you to verified
          doctors, hospitals, labs and pharmacies near you — with every record,
          medicine and report in one place.
        </motion.p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-9 w-full max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.7, delay: 0.28, ease: EASE }}
        >
          <SymptomDemo />
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 18 }}
          transition={{ duration: 0.7, delay: 0.36, ease: EASE }}
        >
          <ButtonLink href="/register" icon={ArrowRight}>
            Start free
          </ButtonLink>
          <ButtonLink href="/chatbot" variant="secondary">
            Try the symptom checker
          </ButtonLink>
        </motion.div>

        <motion.p
          animate={{ opacity: 1 }}
          className="mt-5 text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary/80"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Advisory only — never a substitute for clinical diagnosis
        </motion.p>

        {/* Product preview + floating chips */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-16 w-full max-w-4xl"
          initial={{ opacity: 0, y: 44 }}
          transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
        >
          <FloatingChip className="-left-24 top-10" float="float-slow">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15">
              <HeartPulse className="h-4 w-4 text-primary" />
            </span>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-text-primary">Triage complete</p>
              <p className="text-[10px] text-text-secondary">Severity: moderate</p>
            </div>
          </FloatingChip>

          <FloatingChip className="-right-24 top-24" float="float-medium">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </span>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-text-primary">Dr. Rahman verified</p>
              <p className="text-[10px] text-text-secondary">Credentials approved</p>
            </div>
          </FloatingChip>

          <FloatingChip className="-left-16 bottom-14" float="float-medium">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15">
              <Activity className="h-4 w-4 text-sky-500" />
            </span>
            <div className="text-left">
              <p className="text-[11px] font-semibold text-text-primary">Lab report synced</p>
              <p className="text-[10px] text-text-secondary">CBC · 2 min ago</p>
            </div>
          </FloatingChip>

          <HeroPreview />

          {/* Glow under preview */}
          <div
            aria-hidden
            className="absolute inset-x-10 -bottom-8 -z-10 h-24 rounded-full bg-primary/25 blur-3xl"
          />
        </motion.div>
      </Container>
    </section>
  );
}
