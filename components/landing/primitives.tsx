import type { LucideIcon } from "lucide-react";
import NextLink from "next/link";
import type { ReactNode } from "react";

import { FadeUp } from "@/components/landing/motion";

/* ----------------------------- Layout helpers ----------------------------- */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------ Section header ---------------------------- */

export interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "center" | "left";
  /** Renders eyebrow/description for a dark section regardless of theme. */
  tone?: "default" | "dark";
  id?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "default",
  id,
}: SectionHeadingProps) {
  const alignClasses =
    align === "center" ? "items-center text-center" : "items-start text-left";
  const titleColor = tone === "dark" ? "text-white" : "text-text-primary";
  const descColor = tone === "dark" ? "text-slate-400" : "text-text-secondary";

  return (
    <FadeUp className={`flex flex-col gap-4 ${alignClasses}`}>
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </span>
      <h2
        className={`max-w-2xl text-balance text-3xl font-bold leading-[1.12] tracking-tight md:text-[2.6rem] ${titleColor}`}
        id={id}
      >
        {title}
      </h2>
      {description ? (
        <p className={`max-w-xl text-pretty text-base leading-relaxed ${descColor}`}>
          {description}
        </p>
      ) : null}
    </FadeUp>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost-dark";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_10px_30px_-10px_var(--primary)] hover:shadow-[0_14px_36px_-10px_var(--primary)] hover:brightness-110 dark:text-slate-950",
  secondary:
    "border border-border-custom bg-surface/70 text-text-primary backdrop-blur-md hover:border-primary/40 hover:text-primary",
  "ghost-dark":
    "border border-white/15 bg-white/5 text-white backdrop-blur-md hover:border-white/30 hover:bg-white/10",
};

export interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  icon?: LucideIcon;
  className?: string;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "lg",
  icon: Icon,
  className = "",
}: ButtonLinkProps) {
  const sizing =
    size === "lg" ? "h-12 px-7 text-sm" : "h-10 px-5 text-[13px]";

  return (
    <NextLink
      className={`group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-[0.98] ${sizing} ${BUTTON_STYLES[variant]} ${className}`}
      href={href}
    >
      {children}
      {Icon ? (
        <Icon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      ) : null}
    </NextLink>
  );
}
