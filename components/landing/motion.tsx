"use client";

import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Shared easing curve — a soft "premium" ease-out. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Shared viewport config: animate once, slightly before fully in view. */
export const VIEWPORT = { once: true, margin: "-80px" } as const;

export interface FadeUpProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the animation starts. */
  delay?: number;
  /** Initial vertical offset in px. */
  y?: number;
}

/** Fades and lifts content into view the first time it is scrolled to. */
export function FadeUp({ children, className, delay = 0, y = 28 }: FadeUpProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      viewport={VIEWPORT}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** Parent container that staggers its `StaggerItem` children into view. */
export function Stagger({ children, className }: StaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={staggerParent}
      viewport={VIEWPORT}
      whileInView="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerProps) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}
