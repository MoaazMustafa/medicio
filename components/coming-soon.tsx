"use client";

import { Button, Card, CardContent, CardHeader, Chip } from "@heroui/react";
import NextLink from "next/link";

export interface PlannedModule {
  /** SRS module code, e.g. "M4". */
  code: string;
  name: string;
  summary: string;
}

export interface ComingSoonProps {
  eyebrow: string;
  title: string;
  description: string;
  modules: PlannedModule[];
}

/**
 * Placeholder shown on role landing pages whose modules are not built yet.
 * Deliberately shows no metrics — real numbers arrive with the modules.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  modules,
}: ComingSoonProps) {
  return (
    <section className="flex flex-col items-center gap-8 py-12 md:py-16 max-w-4xl mx-auto px-4">
      <div className="flex flex-col items-center text-center gap-3">
        <Chip
          variant="primary"
          color="accent"
          className="px-3 py-0.5 text-xs font-mono uppercase"
        >
          {eyebrow}
        </Chip>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          {title}
        </h1>

        <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
          {description}
        </p>
      </div>

      <Card className="w-full border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg p-6">
        <CardHeader className="p-0 pb-4 flex flex-col gap-2 items-start">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
            <span className="text-sm font-semibold text-text-primary">
              Coming soon — this portal is under construction
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Your account is active and your role is already enforced across the
            platform. The workspace below unlocks as each module ships.
          </p>
        </CardHeader>

        <hr className="border-t border-border-custom my-2" />

        <CardContent className="p-0 pt-4 flex flex-col gap-3">
          <span className="text-[10px] uppercase font-mono tracking-wider text-text-secondary">
            Planned capabilities
          </span>

          <ul className="flex flex-col gap-3">
            {modules.map((module) => (
              <li
                key={module.code}
                className="flex gap-3 items-start border border-border-custom/50 rounded-lg p-3 bg-background-custom/10"
              >
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                  {module.code}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-primary">
                    {module.name}
                  </span>
                  <span className="text-xs text-text-secondary leading-relaxed">
                    {module.summary}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 justify-center">
        <NextLink href="/">
          <Button variant="primary" className="font-semibold px-5">
            Back to Home
          </Button>
        </NextLink>
      </div>
    </section>
  );
}
