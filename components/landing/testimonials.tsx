"use client";

import { Star } from "lucide-react";

import { Stagger, StaggerItem } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const TESTIMONIALS = [
  {
    quote:
      "The AI intake means I open every consultation already knowing the history, meds and severity. It gives me ten minutes back per patient.",
    name: "Dr. Ayesha Rahman",
    role: "General Practitioner",
    org: "CarePoint Clinics",
    initials: "AR",
    gradient: "from-teal-400 to-cyan-500",
  },
  {
    quote:
      "We plugged our whole facility in — doctors, lab and pharmacy. Referrals that took days now resolve inside one patient record.",
    name: "Imran Chowdhury",
    role: "Operations Director",
    org: "BlueOak Hospital",
    initials: "IC",
    gradient: "from-sky-400 to-blue-500",
  },
  {
    quote:
      "Report delivery used to be phone calls and printouts. Now results land in the patient's portal the moment we publish them.",
    name: "Dr. Farhana Islam",
    role: "Lab Director",
    org: "Helix Diagnostics",
    initials: "FI",
    gradient: "from-violet-400 to-purple-500",
  },
  {
    quote:
      "At 2 AM with a feverish toddler, Medicio told me exactly what mattered and booked a pediatrician for 9 AM. I'll never go back.",
    name: "Nusrat Jahan",
    role: "Patient",
    org: "Dhaka",
    initials: "NJ",
    gradient: "from-rose-400 to-pink-500",
  },
  {
    quote:
      "Patients arrive with a prescription already in the app. We confirm stock before they leave home — fewer wasted trips for everyone.",
    name: "Kamal Uddin",
    role: "Pharmacist",
    org: "Orbit Pharmacy",
    initials: "KU",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    quote:
      "Verification was the reason we joined. Being ranked above scraped listings rewards clinics that do credentialing properly.",
    name: "Dr. Sana Karim",
    role: "Founder",
    org: "Vitalis Group",
    initials: "SK",
    gradient: "from-amber-400 to-orange-500",
  },
] as const;

function Rating() {
  return (
    <div aria-label="5 out of 5 stars" className="flex gap-0.5" role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} aria-hidden className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="scroll-mt-28 py-20 md:py-28" id="testimonials">
      <Container>
        <SectionHeading
          description="Doctors, facilities and patients — the whole network runs on the same rails."
          eyebrow="Loved by the care network"
          title="What early teams are saying"
        />

        <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.name} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-border-custom bg-surface/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_20px_44px_-30px_var(--primary)]">
                <Rating />
                <blockquote className="mt-4 flex-1 text-[13.5px] leading-relaxed text-text-secondary">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-border-custom pt-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${t.gradient}`}
                  >
                    {t.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-text-primary">{t.name}</p>
                    <p className="truncate text-[11.5px] text-text-secondary">
                      {t.role} · {t.org}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
