"use client";

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Chip,
} from "@heroui/react";
import React from "react";

export default function AdminDashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-12 md:py-16 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip variant="primary" color="accent" className="px-3 py-0.5 text-xs font-mono uppercase">
          Super Admin Console
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Administrator Control Panel
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Central authority interface for user management, credential approval, and inventory synchronizations.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">All User Accounts</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">1,248</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Practitioners Pending</span>
          <h2 className="text-3xl font-extrabold text-warning mt-1">14</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Synced Pharmacies</span>
          <h2 className="text-3xl font-extrabold text-success mt-1">32</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Scraper Engine Status</span>
          <h2 className="text-xl font-extrabold text-text-primary mt-2">Standby (0 Jobs)</h2>
        </Card>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Scraper Panel */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg md:col-span-2">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Directory Web Scraper Engine</h3>
            <p className="text-xs text-text-secondary">
              Scrape and compile public registry coordinates of practitioners, labs, and pharmacies.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-4 flex flex-col gap-3 text-xs text-text-secondary leading-relaxed">
            <p>
              Last automated scrape took place 14h ago. <strong>52 unverified records</strong> were ingested and merged with zero collisions.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="primary" size="sm" className="font-semibold px-4">
                Execute Live Scrape
              </Button>
              <Button variant="outline" size="sm" className="font-semibold px-4 text-text-primary">
                View Scraped History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Node System Logs</h3>
            <p className="text-xs text-text-secondary">Real-time gateway audits.</p>
          </CardHeader>
          <CardContent className="p-0 flex flex-col gap-2.5 font-mono text-[10px] text-text-secondary">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>[05:12] DB sync pool resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span>[05:15] POS sync parser cron completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              <span>[05:42] Latency warning Specialty AI</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
