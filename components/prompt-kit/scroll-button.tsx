"use client";

import { Button } from "@heroui/react";
import { ChevronDown } from "lucide-react";
import { useStickToBottomContext } from "use-stick-to-bottom";

import { cn } from "@/lib/utils";

export type ScrollButtonProps = {
  className?: string;
};

// Only works inside ChatContainerRoot (use-stick-to-bottom context).
function ScrollButton({ className }: ScrollButtonProps) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  return (
    <Button
      isIconOnly
      aria-label="Scroll to bottom"
      className={cn(
        "rounded-full border border-border-custom bg-surface text-text-primary shadow-lg transition-all duration-150 ease-out",
        !isAtBottom
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-95 opacity-0",
        className,
      )}
      size="sm"
      variant="secondary"
      onPress={() => scrollToBottom()}
    >
      <ChevronDown className="h-4 w-4" />
    </Button>
  );
}

export { ScrollButton };
