"use client";

import { Card, CardHeader, CardContent, Button, Chip } from "@heroui/react";
import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    // eslint-disable-next-line no-console
    console.error("Medicio Diagnostics Error: ", error);
  }, [error]);

  const handleReturn = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4 text-center max-w-2xl mx-auto py-12">
      {/* Crash Status Header */}
      <div className="flex flex-col items-center gap-3">
        <Chip
          color="warning"
          className="px-3 py-1 text-xs font-semibold font-mono tracking-wider uppercase flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          Critical Alert: Platform Fault
        </Chip>
        
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-text-primary mt-2">
          PORTAL EXCEPTION
        </h1>
        
        <h2 className="text-base md:text-lg text-text-secondary mt-1 max-w-lg">
          The medical portal encountered an unhandled exception. Auto-diagnostics have halted the session to prevent client data corruption.
        </h2>
      </div>

      {/* Error Details */}
      <Card className="w-full text-left p-6 border border-border-custom bg-surface/30 font-mono text-xs text-text-secondary shadow-inner leading-relaxed">
        <CardHeader className="p-0 pb-3 border-b border-border-custom/50 flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-warning/40" />
          <span className="text-[10px] text-text-secondary/60 ml-2">medicio-diagnostic-shell --dump</span>
        </CardHeader>
        <CardContent className="p-0 pt-3 flex flex-col gap-1">
          <p className="text-warning">$ parse-error --details</p>
          <p className="text-danger font-bold">Exception: {error.message || "Unknown segment fault"}</p>
          {error.digest && <p className="text-text-secondary/70">Error Digest: {error.digest}</p>}
          <p className="text-text-secondary/50 mt-2">Telemetry dump complete. Portal shunted to safe state.</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <Button
          variant="primary"
          className="font-semibold text-sm shadow-md"
          onPress={() => reset()}
        >
          Reset Session
        </Button>
        <Button
          variant="outline"
          className="font-semibold text-sm text-text-primary"
          onPress={handleReturn}
        >
          Return to Portal
        </Button>
      </div>
    </section>
  );
}
