"use client";

import { Bot, Hourglass } from "lucide-react";

interface ChatEmptyStateProps {
  agentName: string;
  isModelAvailable?: boolean;
}

export function ChatEmptyState({
  agentName,
  isModelAvailable = true,
}: ChatEmptyStateProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
        {isModelAvailable ? <Bot className="h-7 w-7" /> : <Hourglass className="h-7 w-7" />}
      </div>

      {isModelAvailable ? (
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">What symptoms are you experiencing?</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
            Describe your symptoms, how long you’ve had them, and any health concerns in the input below to begin live clinical triage with {agentName}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-text-primary sm:text-2xl">{agentName} is coming soon</h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-secondary">
            No trained AI model is attached to this specialty yet. Switch to an available specialist model above to begin your triage.
          </p>
        </div>
      )}
    </div>
  );
}
