"use client";

import { Button } from "@heroui/react";

import { cn } from "@/lib/utils";

export type PromptSuggestionProps = {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
};

function PromptSuggestion({ children, className, onPress }: PromptSuggestionProps) {
  return (
    <Button
      className={cn(
        "h-auto min-h-8 rounded-full border border-border-custom bg-surface/80 px-3.5 py-1.5 text-xs font-normal text-text-secondary hover:border-primary/40 hover:text-text-primary",
        className,
      )}
      size="sm"
      variant="secondary"
      onPress={onPress}
    >
      {children}
    </Button>
  );
}

export { PromptSuggestion };
