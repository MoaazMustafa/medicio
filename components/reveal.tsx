"use client";

import { useEffect, useRef, useState } from "react";

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Transition delay in ms, useful for staggering cards in a grid. */
  delay?: number;
}

/**
 * Fades and lifts content into view the first time it scrolls into the
 * viewport (IntersectionObserver + CSS transition, see globals.css).
 */
export function Reveal({ children, className = "", delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
