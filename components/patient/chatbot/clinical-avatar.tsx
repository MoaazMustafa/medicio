"use client";

import Avatar from "boring-avatars";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

export const SPECIALTY_PALETTES: Record<string, string[]> = {
  GENERAL: ["#0EA5E9", "#14B8A6", "#38BDF8", "#0284C7", "#F0FDF4"],
  CARDIOLOGY: ["#EF4444", "#F43F5E", "#FB7185", "#FDA4AF", "#FFE4E6"],
  DERMATOLOGY: ["#F59E0B", "#F97316", "#FBBF24", "#FDE68A", "#FEF3C7"],
  NEUROLOGY: ["#8B5CF6", "#6366F1", "#A78BFA", "#C4B5FD", "#EDE9FE"],
  PEDIATRICS: ["#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"],
  ORTHOPEDICS: ["#64748B", "#0EA5E9", "#94A3B8", "#CBD5E1", "#F1F5F9"],
  GYNECOLOGY: ["#F43F5E", "#EC4899", "#FDA4AF", "#FCE7F3", "#FFF1F2"],
  ENT: ["#10B981", "#059669", "#34D399", "#6EE7B7", "#D1FAE5"],
  OPHTHALMOLOGY: ["#2563EB", "#4F46E5", "#60A5FA", "#93C5FD", "#EFF6FF"],
  PSYCHIATRY: ["#7C3AED", "#8B5CF6", "#A78BFA", "#DDD6FE", "#F5F3FF"],
  GASTROENTEROLOGY: ["#EAB308", "#84CC16", "#FACC15", "#FEF08A", "#FEFCE8"],
  PULMONOLOGY: ["#06B6D4", "#0284C7", "#67E8F9", "#A5F3FC", "#ECFEFF"],
};

const DEFAULT_PALETTE = ["#0EA5E9", "#14B8A6", "#38BDF8", "#0284C7", "#F0FDF4"];

const VARIANTS: Array<"beam" | "marble" | "sunset" | "ring"> = [
  "beam",
  "marble",
  "sunset",
  "ring",
];

interface ClinicalAvatarProps {
  name: string;
  specialty?: string;
  size?: number;
  className?: string;
  isInteractive?: boolean;
  isThinking?: boolean;
  showStatus?: boolean;
}

export function ClinicalAvatar({
  name,
  specialty = "GENERAL",
  size = 36,
  className,
  isInteractive = true,
  isThinking = false,
  showStatus = false,
}: ClinicalAvatarProps) {
  const [variantIndex, setVariantIndex] = useState<number>(0);
  const colors = SPECIALTY_PALETTES[specialty] ?? DEFAULT_PALETTE;
  const currentVariant = VARIANTS[variantIndex % VARIANTS.length];

  const handleCycleVariant = () => {
    if (!isInteractive) return;
    setVariantIndex((prev) => (prev + 1) % VARIANTS.length);
  };

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center rounded-full transition-transform duration-200",
        isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
        isThinking && "animate-pulse",
        className,
      )}
      onClick={handleCycleVariant}
      title={isInteractive ? `${name} (Click to toggle style)` : name}
      style={{ width: size, height: size }}
    >
      {/* Outer subtle glow ring when thinking */}
      {isThinking && (
        <span
          className="absolute inset-0 -m-1 rounded-full border-2 border-primary/50 animate-ping opacity-75 pointer-events-none"
          style={{ width: size + 8, height: size + 8 }}
        />
      )}

      {/* Boring Avatar SVG */}
      <div className="overflow-hidden rounded-full shadow-xs">
        <Avatar
          colors={colors}
          name={name}
          size={size}
          variant={currentVariant}
        />
      </div>

      {/* Online / Active status indicator dot */}
      {showStatus && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface",
            size >= 48 ? "h-3.5 w-3.5" : "h-2.5 w-2.5",
            isThinking ? "bg-cyan-400 animate-pulse" : "bg-emerald-500",
          )}
        />
      )}
    </div>
  );
}
