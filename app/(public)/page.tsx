
import { Button, Card, Chip } from "@heroui/react";
import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  CalendarCheck,
  FlaskConical,
  FolderHeart,
  MessageSquareText,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import NextLink from "next/link";

import { BlurText } from "@/components/blur-text";
import { HeroBackground } from "@/components/hero-background";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "AI-Powered Healthcare Access",
  description:
    "Describe your symptoms, get an instant AI triage, and connect with verified doctors, hospitals, labs and pharmacies near you — all in one place.",
};

const HOW_IT_WORKS = [
  {
    icon: MessageSquareText,
    step: "01",
    title: "Describe your symptoms",
    text: "A conversational intake collects your symptoms, duration, medicines tried and pre-existing conditions.",
  },
  {
    icon: Activity,
    step: "02",
    title: "Get an instant triage",
    text: "The AI assesses severity, lists possible conditions and tells you whether a doctor visit is warranted.",
  },
  {
    icon: CalendarCheck,
    step: "03",
    title: "Book verified care nearby",
    text: "See verified doctors, labs and pharmacies around you — always ranked above unverified listings.",
  },
] as const;

const FEATURES = [
  {
    icon: Stethoscope,
    title: "AI Symptom Checker",
    text: "Conversational triage that turns 'what should I do?' into a clear severity level and next step — advisory only, always paired with a medical disclaimer.",
  },
  {
    icon: Bot,
    title: "Specialty AI Agents",
    text: "Focused assistants scoped to a single doctor, hospital or lab — or to a specialty like dermatology — so answers stay on topic.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Provider Network",
    text: "Doctors pass credential verification before appearing as verified. Scraped public listings are always visually tagged as unverified.",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booking",
    text: "Search by specialty, availability and proximity, then book directly against a doctor's published time slots.",
  },
  {
    icon: Pill,
    title: "Medicine Tracker",
    text: "Log what you take with dosage and schedule. Your history feeds the symptom checker so advice accounts for it.",
  },
  {
    icon: FolderHeart,
    title: "Unified Health Records",
    text: "Lab reports, medicine history, appointments and past consultations — consolidated in one patient portal you control.",
  },
] as const;

const PROVIDER_ROLES = [
  {
    icon: Stethoscope,
    title: "Doctors",
    text: "Verified profiles, self-managed availability and a personal AI agent.",
  },
  {
    icon: Building2,
    title: "Hospitals",
    text: "Facility profiles with affiliated doctors, labs and pharmacies.",
  },
  {
    icon: FlaskConical,
    title: "Labs",
    text: "Test catalogues, pricing and report delivery straight to patients.",
  },
  {
    icon: Pill,
    title: "Pharmacies",
    text: "POS-synced or manually managed inventory patients can find.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative w-full overflow-hidden">
        <HeroBackground />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-16 md:pt-32 md:pb-20 flex flex-col items-center text-center gap-6">
          <Chip
            variant="primary"
            color="accent"
            className="px-4 py-1 text-xs font-semibold tracking-wider uppercase font-mono flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            AI-Powered Healthcare Access
          </Chip>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-text-primary max-w-3xl leading-tight">
            <BlurText text="From symptom to the" />{" "}
            <BlurText
              text="right care,"
              className="text-gradient-primary"
              delay={280}
            />{" "}
            <BlurText text="in minutes." delay={420} />
          </h1>

          <p className="text-base md:text-lg text-text-secondary leading-relaxed max-w-2xl blur-in-word [animation-delay:600ms]">
            Medicio&apos;s AI symptom checker triages your concern, then connects
            you to verified doctors, hospitals, labs and pharmacies near you —
            with your health records in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 ">
            <NextLink href="/register">
              <Button
                variant="primary"
                className="font-semibold h-12 px-8 shadow-lg text-sm flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </NextLink>
            <NextLink href="/login">
              <Button
                variant="outline"
                className="font-semibold h-12 px-8 text-sm text-text-primary border-border-custom"
              >
                Sign In
              </Button>
            </NextLink>
          </div>

          <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono mt-2">
            Advisory only — Medicio never replaces a professional clinical
            diagnosis.
          </p>

          {/* Product preview */}
          <Reveal className="w-full max-w-4xl mt-8">
            <div className="rounded-2xl border border-border-custom bg-surface/50 backdrop-blur-md shadow-2xl p-2">
              <Image
                src="/images/app-preview.svg"
                alt="Preview of the Medicio patient dashboard"
                width={1200}
                height={630}
                priority
                className="rounded-xl w-full h-auto"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* --------------------------- How it works -------------------------- */}
      <section
        aria-labelledby="how-it-works-heading"
        className="mx-auto max-w-6xl px-6 py-16 w-full"
      >
        <Reveal className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-primary">
            How it works
          </span>
          <h2
            id="how-it-works-heading"
            className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary"
          >
            Three steps between you and the right care
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, index) => (
            <Reveal key={item.step} delay={index * 120}>
              <Card className="p-6 h-full border border-border-custom bg-surface/40 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-border-custom">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary">
                  {item.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {item.text}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------- Features ---------------------------- */}
      <section
        aria-labelledby="features-heading"
        className="w-full border-y border-border-custom bg-surface/20"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="flex flex-col items-center text-center gap-3 mb-10">
            <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-primary">
              Platform
            </span>
            <h2
              id="features-heading"
              className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary"
            >
              Everything your health journey needs
            </h2>
            <p className="text-sm text-text-secondary max-w-xl">
              One account connects triage, booking, medicines and records —
              built on a strictly role-guarded platform.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={(index % 3) * 120}>
                <Card className="p-6 h-full border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-3 hover:border-primary/40 transition-colors">
                  <span className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </span>
                  <h3 className="text-base font-bold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {feature.text}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- For providers ------------------------- */}
      <section
        aria-labelledby="providers-heading"
        className="mx-auto max-w-6xl px-6 py-16 w-full"
      >
        <Reveal className="flex flex-col items-center text-center gap-3 mb-10">
          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-primary">
            For providers
          </span>
          <h2
            id="providers-heading"
            className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary"
          >
            Built for the whole care network
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROVIDER_ROLES.map((role, index) => (
            <Reveal key={role.title} delay={index * 100}>
              <Card className="p-5 h-full border border-border-custom bg-surface/40 flex flex-col gap-2">
                <role.icon className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">
                  {role.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {role.text}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------- CTA ------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-8 w-full">
        <Reveal>
          <Card className="relative overflow-hidden border border-border-custom bg-surface/50 backdrop-blur-md p-10 md:p-14 flex flex-col items-center text-center gap-5">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-40"
            >
              <div className="aurora-blob aurora-1" style={{ opacity: 0.25 }} />
              <div className="aurora-blob aurora-2" style={{ opacity: 0.2 }} />
            </div>

            <h2 className="relative text-2xl md:text-3xl font-bold tracking-tight text-text-primary max-w-lg">
              Ready to take control of your health?
            </h2>
            <p className="relative text-sm text-text-secondary max-w-md">
              Create a free account and let Medicio guide your next step — from
              first symptom to booked appointment.
            </p>
            <NextLink href="/register" className="relative">
              <Button
                variant="primary"
                className="font-semibold h-12 px-8 shadow-lg text-sm flex items-center gap-2"
              >
                Create Your Free Account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </NextLink>
          </Card>
        </Reveal>
      </section>
    </div>
  );
}
