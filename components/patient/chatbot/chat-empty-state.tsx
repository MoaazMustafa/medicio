"use client";

import { Hourglass, Sparkles } from "lucide-react";

interface ChatEmptyStateProps {
  agentName: string;
  isModelAvailable?: boolean;
}

export function ChatEmptyState({
  agentName,
  isModelAvailable = true,
}: ChatEmptyStateProps) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 text-center animate-in fade-in duration-500">
      {/* Modern icon badge */}
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-primary/30 bg-surface/80 text-primary shadow-lg backdrop-blur-xl">
        {isModelAvailable ? (
          <Sparkles className="h-7 w-7 animate-pulse text-primary" />
        ) : (
          <Hourglass className="h-7 w-7 text-text-secondary" />
        )}
      </div>

      {isModelAvailable ? (
        <div className="flex flex-col items-center gap-3">
          {/* Solid crisp headline with moving background gradient */}
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
            Hello, how can I help you?
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-text-secondary">
            Describe your symptoms or health concerns to start live, evidence-based clinical intake with <span className="font-semibold text-text-primary">{agentName}</span>.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{agentName} is coming soon</h1>
          <p className="max-w-md text-sm leading-relaxed text-text-secondary">
            This specialist model is currently undergoing certified clinical validation. Please choose an active specialist model below.
          </p>
        </div>
      )}
    </div>
  );
}
