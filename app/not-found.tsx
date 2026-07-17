"use client";

import { Card, CardHeader, CardContent, Button, Chip } from "@heroui/react";
import NextLink from "next/link";
import React from "react";

export default function NotFound() {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4 text-center max-w-2xl mx-auto py-12">
      {/* 404 Status Header */}
      <div className="flex flex-col items-center gap-3">
        <Chip
          color="danger"
          className="px-3 py-1 text-xs font-semibold font-mono tracking-wider uppercase flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          System Code: 404 // Access Error
        </Chip>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tight text-text-primary mt-2">
          404
        </h1>
        
        <h2 className="text-xl md:text-2xl font-bold text-text-primary mt-1">
          Clinical Resource Offline
        </h2>
      </div>

      {/* Terminal Traceback Mockup */}
      <Card className="w-full text-left p-6 border border-border-custom bg-surface/30 font-mono text-xs text-text-secondary shadow-inner leading-relaxed">
        <CardHeader className="p-0 pb-3 border-b border-border-custom/50 flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-danger/40" />
          <span className="w-3 h-3 rounded-full bg-warning/40" />
          <span className="w-3 h-3 rounded-full bg-success/40" />
          <span className="text-[10px] text-text-secondary/60 ml-2">medicio-system-shell --trace</span>
        </CardHeader>
        <CardContent className="p-0 pt-3 flex flex-col gap-1">
          <p className="text-danger">$ resolve --resource sector-search-node</p>
          <p className="text-text-secondary/70">Searching Medicio database catalogs...</p>
          <p className="text-text-secondary/70">Query index: [Scraped and registered entities checked]</p>
          <p className="text-danger font-bold">Error: Page not found. DB link unestablished.</p>
          <p className="text-text-secondary/50">Traceback: RouteException at client-core.tsx:L74</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        <NextLink href="/">
          <Button
            variant="primary"
            className="font-semibold text-sm shadow-md"
          >
            Return to Portal
          </Button>
        </NextLink>
        <Button
          variant="outline"
          className="font-semibold text-sm text-text-primary"
          onPress={handleReload}
        >
          Retry Connection
        </Button>
      </div>
    </section>
  );
}
