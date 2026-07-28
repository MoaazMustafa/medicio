"use client";

import { Input } from "@heroui/react";
import React, { useRef, useCallback } from "react";

export interface OtpInputProps {
  /** Current 6-digit value (may be shorter while user is typing). */
  value: string;
  /** Called with the full concatenated string whenever any digit changes. */
  onChange: (value: string) => void;
  /** Number of OTP digits (default 6). */
  length?: number;
  /** Disables all inputs. */
  disabled?: boolean;
}

/**
 * Trendy 6-box OTP input — each digit gets its own focused input cell.
 * Supports auto-advance on digit entry, backspace navigation, and full paste.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusIndex = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, length - 1));
      inputRefs.current[clamped]?.focus();
    },
    [length],
  );

  const updateDigit = useCallback(
    (idx: number, char: string) => {
      const next = digits.slice();
      next[idx] = char;
      onChange(next.join(""));
    },
    [digits, onChange],
  );

  const handleChange = useCallback(
    (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Filter to digits only
      const char = raw.replace(/\D/g, "").slice(-1);

      if (char) {
        updateDigit(idx, char);
        focusIndex(idx + 1);
      }
    },
    [updateDigit, focusIndex],
  );

  const handleKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (digits[idx]) {
          updateDigit(idx, "");
        } else if (idx > 0) {
          updateDigit(idx - 1, "");
          focusIndex(idx - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusIndex(idx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusIndex(idx + 1);
      }
    },
    [digits, updateDigit, focusIndex],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);

      if (pasted) {
        onChange(pasted.padEnd(length, "").slice(0, length));
        // Focus the cell after the last pasted digit
        focusIndex(Math.min(pasted.length, length - 1));
      }
    },
    [onChange, focusIndex, length],
  );

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {digits.map((digit, idx) => (
        <Input
          key={idx}
          ref={(el: HTMLInputElement | null) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => (e.target as HTMLInputElement).select()}
          aria-label={`Digit ${idx + 1} of ${length}`}
          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono border border-border-custom bg-background-custom/30 rounded-lg text-text-primary focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all duration-150 [&_input]:text-center [&_input]:p-0"
        />
      ))}
    </div>
  );
}
