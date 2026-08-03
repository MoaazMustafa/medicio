"use client";

import { Bot, Hourglass } from "lucide-react";

import { PromptSuggestion } from "@/components/prompt-kit/prompt-suggestion";

const FALLBACK_PROMPTS = [
  "I've had a dull headache with eye strain for 2 days",
  "Sudden skin rash and itching on arms after eating seafood",
  "High fever (101°F) with dry cough and body aches",
  "Mild stomach cramps after eating dinner last night",
];

interface ChatEmptyStateProps {
  agentName: string;
  isModelAvailable?: boolean;
  suggestions?: string[];
  onPromptSelect: (_promptText: string) => void;
}

export function ChatEmptyState({
  agentName,
  isModelAvailable = true,
  suggestions,
  onPromptSelect,
}: ChatEmptyStateProps) {
  const prompts = suggestions && suggestions.length > 0 ? suggestions : FALLBACK_PROMPTS;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
        {isModelAvailable ? <Bot className="h-7 w-7" /> : <Hourglass className="h-7 w-7" />}
      </div>

      {isModelAvailable ? (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">How are you feeling today?</h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
              Describe your symptoms to start a guided clinical intake with {agentName}, or pick a common concern below.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {prompts.map((prompt) => (
              <PromptSuggestion key={prompt} onPress={() => onPromptSelect(prompt)}>
                {prompt}
              </PromptSuggestion>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{agentName} is coming soon</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
            No trained AI model is attached to this specialty yet. Switch to an available specialist model above to
            begin your triage.
          </p>
        </div>
      )}
    </div>
  );
}
