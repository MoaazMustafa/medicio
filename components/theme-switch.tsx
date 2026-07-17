"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { FC} from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export interface ThemeSwitchProps {
  className?: string;
  duration?: number;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({
  className,
  duration = 700,
}) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme = isDark ? "light" : "dark";

    // Fallback if view transitions are not supported
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // @ts-ignore
    await document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    }).ready;

    const { top, left, width, height } =
      buttonRef.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top),
    );

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  }, [isDark, setTheme, duration]);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className={clsx(
          "px-px transition-opacity hover:opacity-80 cursor-pointer",
          "inline-flex items-center justify-center",
          "w-8 h-8 bg-transparent rounded-lg text-muted",
          className
        )}
      >
        <Moon className="w-5 h-5 text-current" />
      </button>
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={clsx(
        "px-px transition-opacity hover:opacity-80 cursor-pointer",
        "inline-flex items-center justify-center",
        "w-8 h-8 bg-transparent rounded-lg text-current",
        className
      )}
      title={`Current: ${isDark ? "Dark" : "Light"} theme`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
