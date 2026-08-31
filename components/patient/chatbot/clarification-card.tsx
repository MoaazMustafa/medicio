"use client";

import { Button, Chip, Input } from "@heroui/react";
import { ArrowRight, Check, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";

import type { ClarificationQuestion } from "@/components/patient/patient-context";
import { cn } from "@/lib/utils";

interface ClarificationCardProps {
  questions: ClarificationQuestion[];
  /** Only the latest clarification request stays interactive. */
  isActive: boolean;
  isLoading: boolean;
  onSubmit: (_answers: Record<string, string>) => void;
}

export function ClarificationCard({ questions, isActive, isLoading, onSubmit }: ClarificationCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const answeredCount = Object.keys(answers).length;
  const interactive = isActive && !isLoading;

  const handleOptionToggle = (questionId: string, option: string, isMulti?: boolean) => {
    if (!interactive) return;

    if (!isMulti) {
      setAnswers((prev) => ({ ...prev, [questionId]: option }));
      return;
    }

    // Multi-select handling (comma-separated values)
    setAnswers((prev) => {
      const currentVal = prev[questionId] || "";
      const currentList = currentVal ? currentVal.split(", ").filter(Boolean) : [];

      if (option.includes("None") || option.includes("Generally Healthy") || option.includes("No current medications")) {
        return { ...prev, [questionId]: option };
      }

      // If choosing a specific illness, remove "None"
      const cleanList = currentList.filter(
        (item) => !item.includes("None") && !item.includes("Generally Healthy") && !item.includes("No current medications"),
      );

      let updatedList: string[];
      if (cleanList.includes(option)) {
        updatedList = cleanList.filter((item) => item !== option);
      } else {
        updatedList = [...cleanList, option];
      }

      if (updatedList.length === 0) {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      }

      return { ...prev, [questionId]: updatedList.join(", ") };
    });
  };

  const handleCustomAdd = (questionId: string) => {
    const val = (customInputs[questionId] || "").trim();
    if (!val || !interactive) return;

    setAnswers((prev) => {
      const currentVal = prev[questionId] || "";
      const currentList = currentVal ? currentVal.split(", ").filter(Boolean) : [];
      const updatedList = [...currentList.filter((i) => !i.includes("None")), val];
      return { ...prev, [questionId]: updatedList.join(", ") };
    });

    setCustomInputs((prev) => ({ ...prev, [questionId]: "" }));
  };

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-primary/20 bg-surface p-4.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border-custom/80 pb-2.5">
        <span className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-primary uppercase">
          <ShieldCheck className="h-4 w-4" /> Clinical Intake &amp; History
        </span>
        <Chip className="font-mono text-[10px]" size="sm" variant="soft">
          {answeredCount}/{questions.length} answered
        </Chip>
      </div>

      <p className="text-xs text-text-secondary">
        Please complete these clinical questions so the AI can evaluate disease risks, verify medication contraindications, and suggest the right verified specialist.
      </p>

      {questions.map((q) => {
        const selectedVal = answers[q.id] || "";
        const selectedList = selectedVal ? selectedVal.split(", ").filter(Boolean) : [];
        const isMulti = q.allowMultiSelect ?? (q.id === "comorbidities" || q.id === "medications");

        return (
          <div key={q.id} className="flex flex-col gap-2 rounded-xl border border-border-custom/50 bg-background-custom/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-primary">{q.question}</span>
              {isMulti && (
                <span className="text-[10px] font-mono text-text-secondary">(Select all that apply)</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {q.options.map((opt) => {
                const isSelected = isMulti ? selectedList.includes(opt) : selectedVal === opt;

                return (
                  <Button
                    key={opt}
                    className={cn(
                      "h-auto min-h-7 rounded-full px-3 py-1.5 text-[11px] font-normal transition-all",
                      isSelected && "border-primary font-semibold text-white",
                    )}
                    isDisabled={!interactive}
                    size="sm"
                    variant={isSelected ? "primary" : "secondary"}
                    onPress={() => handleOptionToggle(q.id, opt, isMulti)}
                  >
                    {isSelected && <Check className="mr-1 h-3 w-3 inline-block" />}
                    {opt}
                  </Button>
                );
              })}
            </div>

            {isMulti && interactive && (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  aria-label={`Custom entry for ${q.question}`}
                  className="h-8 text-xs"
                  placeholder="Other condition or medication..."
                  value={customInputs[q.id] || ""}
                  onChange={(e) => setCustomInputs((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCustomAdd(q.id);
                    }
                  }}
                />
                <Button
                  isIconOnly
                  aria-label="Add custom option"
                  className="h-8 w-8 min-w-8 rounded-full"
                  isDisabled={!(customInputs[q.id] || "").trim()}
                  size="sm"
                  variant="secondary"
                  onPress={() => handleCustomAdd(q.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {isActive && (
        <div className="flex items-center justify-between border-t border-border-custom/80 pt-3">
          <span className="text-[11px] text-text-secondary">
            {answeredCount === 0 ? "Select options above to continue" : "Ready to synthesize clinical assessment"}
          </span>
          <Button
            className="rounded-full text-xs font-semibold"
            isDisabled={answeredCount === 0 || isLoading}
            size="sm"
            variant="primary"
            onPress={() => onSubmit(answers)}
          >
            Synthesize Triage Report <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
