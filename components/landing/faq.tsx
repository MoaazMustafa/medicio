"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";

import { EASE, FadeUp } from "@/components/landing/motion";
import { Container, SectionHeading } from "@/components/landing/primitives";

const FAQS = [
  {
    question: "Is Medicio a replacement for seeing a doctor?",
    answer:
      "No. Medicio's AI is advisory only — it helps you understand severity and find the right care faster, but it never issues a diagnosis. Every AI response carries a medical disclaimer, and urgent signals always route you toward professional care.",
  },
  {
    question: "How are doctors verified?",
    answer:
      "Doctors submit credentials that are reviewed before the verified badge appears on their profile. Verified providers always rank above unverified listings, and public listings scraped from the web are clearly tagged as unverified.",
  },
  {
    question: "Is my health data secure and private?",
    answer:
      "Yes. Every record sits behind strict role-guarded access control — a lab can only see what a lab needs, and no provider sees your data without a relationship with you. Data is encrypted in transit and at rest.",
  },
  {
    question: "What does Medicio cost for patients?",
    answer:
      "Nothing — symptom checks, provider search, booking, the medicine tracker and your health record are free for patients, forever. Providers pay for practice tools like verified profiles, agents and analytics.",
  },
  {
    question: "What are specialty AI agents?",
    answer:
      "They're focused assistants scoped to a single doctor, hospital, lab or specialty — like dermatology. Because their scope is narrow, their answers stay on-topic, reflect that provider's services, and hand off to booking when appropriate.",
  },
  {
    question: "How does appointment booking work?",
    answer:
      "Doctors publish their real availability. You search by specialty, distance and time, pick a slot and book instantly — no phone calls. Your intake summary and relevant history reach the doctor before the visit.",
  },
  {
    question: "Can hospitals, labs and pharmacies join too?",
    answer:
      "Yes — Medicio is built for the whole network. Facilities get profiles with affiliated doctors, labs publish test catalogues and deliver reports digitally, and pharmacies surface live inventory patients can find.",
  },
] as const;

function FaqItem({
  answer,
  index,
  isOpen,
  onToggle,
  question,
}: {
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
}) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div
      className={`overflow-hidden rounded-2xl border transition-colors duration-300 ${
        isOpen ? "border-primary/35 bg-surface" : "border-border-custom bg-surface/50"
      }`}
    >
      <h3>
        <button
          aria-controls={panelId}
          aria-expanded={isOpen}
          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          id={buttonId}
          type="button"
          onClick={onToggle}
        >
          <span className="text-sm font-semibold text-text-primary sm:text-[15px]">
            {question}
          </span>
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
              isOpen ? "bg-primary text-white dark:text-slate-950" : "bg-primary/10 text-primary"
            }`}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <Plus className="h-3.5 w-3.5" />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            aria-labelledby={buttonId}
            exit={{ height: 0, opacity: 0 }}
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            role="region"
            transition={{ duration: 0.35, ease: EASE }}
          >
            <p className="px-6 pb-6 text-[13.5px] leading-relaxed text-text-secondary">
              {answer}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="scroll-mt-28 py-20 md:py-28" id="faq">
      <Container>
        <SectionHeading
          description="Everything patients and providers ask before joining the network."
          eyebrow="FAQ"
          title="Questions, answered"
        />

        <FadeUp className="mx-auto mt-12 flex max-w-3xl flex-col gap-3.5" delay={0.1}>
          {FAQS.map((faq, index) => (
            <FaqItem
              key={faq.question}
              answer={faq.answer}
              index={index}
              isOpen={openIndex === index}
              question={faq.question}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </FadeUp>
      </Container>
    </section>
  );
}
