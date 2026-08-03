"use client";


import { Button } from "@heroui/react";
import { ArrowRight, HelpCircle } from "lucide-react";
import { useState } from "react";

import type { ClarificationQuestion } from "@/components/patient/patient-context";
import { cn } from "@/lib/utils";

interface ClarificationCardProps {
  questions: ClarificationQuestion[];
  /** Only the latest clarification request stays interactive. */
  isActive: boolean;
  isLoading: boolean;
  onSubmit: (answers: Record<string, string>) => void;
}

export function ClarificationCard({ questions, isActive, isLoading, onSubmit }: ClarificationCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answeredCount = Object.keys(answers).length;
  const interactive = isActive && !isLoading;

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-border-custom bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold tracking-wider text-primary uppercase">
          <HelpCircle className="h-3.5 w-3.5" /> A few quick questions
        </span>
        <span className="text-[10px] font-mono text-text-secondary">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-primary">{q.question}</span>
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((opt) => {
              const isSelected = answers[q.id] === opt;

              return (
                <Button
                  key={opt}
                  className={cn(
                    "h-auto min-h-7 rounded-full px-3 py-1 text-[11px] font-normal",
                    isSelected && "font-semibold",
                  )}
                  isDisabled={!interactive}
                  size="sm"
                  variant={isSelected ? "primary" : "secondary"}
                  onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                >
                  {opt}
                </Button>
              );
            })}
          </div>
        </div>
      ))}

      {isActive && (
        <Button
          className="self-start rounded-full text-xs font-semibold"
          isDisabled={answeredCount === 0 || isLoading}
          size="sm"
          variant="primary"
          onPress={() => onSubmit(answers)}
        >
          Generate triage assessment <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
