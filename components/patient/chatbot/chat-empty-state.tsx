"use client";

import { Hourglass } from "lucide-react";

import { ClinicalAvatar } from "./clinical-avatar";

interface ChatEmptyStateProps {
  agentName: string;
  specialty?: string;
  isModelAvailable?: boolean;
}

export function ChatEmptyState({
  agentName,
  specialty = "GENERAL",
  isModelAvailable = true,
}: ChatEmptyStateProps) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 text-center animate-in fade-in duration-500">
      {/* Gemini-Style Fluid Aurora - ONLY behind empty state greeting heading */}
      {isModelAvailable && (
        <div className="gemini-greeting-aurora">
          <div className="aurora-node-1" />
          <div className="aurora-node-2" />
          <div className="aurora-node-3" />
        </div>
      )}

      {/* Modern interactive avatar badge */}
      <div className="relative z-10 flex items-center justify-center">
        {isModelAvailable ? (
          <>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-primary/30 to-purple-500/20 blur-lg animate-pulse" />
            <ClinicalAvatar
              name={agentName}
              specialty={specialty}
              size={68}
              isInteractive={true}
              showStatus={true}
              className="relative z-10 shadow-xl ring-4 ring-surface/80 hover:ring-primary/40 transition-all duration-300"
            />
          </>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-border-custom bg-surface/80 text-text-secondary shadow-lg backdrop-blur-xl">
            <Hourglass className="h-7 w-7" />
          </div>
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
