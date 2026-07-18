"use client";

import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Chip,
} from "@heroui/react";
import React from "react";

export default function PharmacyDashboardPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 py-12 md:py-16 max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <Chip variant="primary" color="accent" className="px-3 py-0.5 text-xs font-mono uppercase">
          Pharmacy Portal
        </Chip>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
          Pharmacy Control Panel
        </h1>
        <p className="text-sm text-text-secondary max-w-lg">
          Synchronize POS stock quantities, verify item listings, and check medicine order requests.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full mt-4">
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">SKU Count</span>
          <h2 className="text-3xl font-extrabold text-primary mt-1">420</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Low Stock Alerts</span>
          <h2 className="text-3xl font-extrabold text-danger mt-1">8</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Sync Health Rate</span>
          <h2 className="text-3xl font-extrabold text-success mt-1">100%</h2>
        </Card>
        <Card className="p-5 border border-border-custom bg-surface/30">
          <span className="text-[10px] font-bold font-mono text-text-secondary uppercase">Dispatched Orders</span>
          <h2 className="text-3xl font-extrabold text-text-primary mt-1">142</h2>
        </Card>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* POS Syncer */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg md:col-span-2">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Point-of-Sale Stock Integration</h3>
            <p className="text-xs text-text-secondary">
              Review synced product quantities from your primary checkout ledger.
            </p>
          </CardHeader>
          <CardContent className="p-0 pb-4 flex flex-col gap-3 text-xs text-text-secondary leading-relaxed">
            <p>
              Medicio is currently integrated with your cashier POS system via standard parser adapters. Inventory runs update every hour.
            </p>
            <div className="flex gap-3 mt-2">
              <Button variant="primary" size="sm" className="font-semibold px-4">
                Manual Trigger Sync
              </Button>
              <Button variant="outline" size="sm" className="font-semibold px-4 text-text-primary">
                View Inventory List
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md shadow-lg">
          <CardHeader className="p-0 pb-4 flex flex-col gap-1 items-start">
            <h3 className="text-lg font-bold text-text-primary">Restock Alerts</h3>
            <p className="text-xs text-text-secondary">Critical items under threshold levels.</p>
          </CardHeader>
          <CardContent className="p-0 flex flex-col gap-2.5 text-xs text-text-secondary">
            <div className="flex justify-between border-b border-border-custom/30 pb-2">
              <span>Amoxicillin 250mg</span>
              <strong className="text-danger">12 left</strong>
            </div>
            <div className="flex justify-between border-b border-border-custom/30 pb-2">
              <span>Paracetamol 500mg</span>
              <strong className="text-warning">45 left</strong>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
