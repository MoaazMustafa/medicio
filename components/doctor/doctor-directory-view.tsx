"use client";

import { Button, Card, Chip, Input } from "@heroui/react";
import { Search, ShieldCheck, MapPin, Stethoscope, RefreshCw } from "lucide-react";
import React, { useState } from "react";

import { useDoctorContext } from "./doctor-context";

export function DoctorDirectoryView() {
  const { scrapedDirectory, fetchDirectory } = useDoctorContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");

  const specialties = Array.from(
    new Set(scrapedDirectory.map((d) => d.specialty).filter(Boolean))
  );

  const filteredDirectory = scrapedDirectory.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.specialty || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.clinicAddress || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecialty =
      specialtyFilter === "ALL" || doc.specialty === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <span>Doctor Directory & Scraped Listings</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            FR-DOC-07: Unregistered doctors appear as scraped listings. Verified registered doctors are badged and ranked above unverified scraped directory entries.
          </p>
        </div>

        <Button variant="secondary" size="sm" className="text-xs font-semibold shrink-0" onPress={fetchDirectory}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Directory
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by doctor name, specialty, or clinic address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={specialtyFilter === "ALL" ? "primary" : "secondary"}
            size="sm"
            className="text-xs font-semibold px-3"
            onPress={() => setSpecialtyFilter("ALL")}
          >
            All Specialties
          </Button>
          {specialties.map((spec) => (
            <Button
              key={spec}
              variant={specialtyFilter === spec ? "primary" : "secondary"}
              size="sm"
              className="text-xs font-semibold px-3"
              onPress={() => setSpecialtyFilter(spec)}
            >
              {spec}
            </Button>
          ))}
        </div>
      </div>

      {filteredDirectory.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs flex flex-col items-center gap-2">
          <Stethoscope className="w-8 h-8 text-text-secondary/40" />
          <span>No medical directory entries found matching your search.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDirectory.map((doc) => (
            <Card
              key={doc.id}
              className={`p-4 border ${
                doc.isVerified
                  ? "border-emerald-500/40 bg-emerald-950/10"
                  : doc.isScraped
                  ? "border-border-custom bg-surface/30"
                  : "border-amber-500/30 bg-amber-950/10"
              } flex flex-col gap-2 shadow-xs transition-all hover:border-primary/40`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary text-sm">{doc.name}</span>
                {doc.isVerified ? (
                  <Chip color="success" variant="soft" className="text-[10px] font-semibold">
                    <ShieldCheck className="w-3 h-3 inline mr-1" /> Verified Doctor
                  </Chip>
                ) : doc.isScraped ? (
                  <Chip color="warning" variant="soft" className="text-[10px] font-semibold">
                    Suggested Scraped Record
                  </Chip>
                ) : (
                  <Chip color="default" variant="soft" className="text-[10px]">
                    Registered (Pending Review)
                  </Chip>
                )}
              </div>

              <span className="text-xs font-semibold text-primary">{doc.specialty}</span>
              <span className="text-xs text-text-secondary">{doc.education}</span>
              {doc.clinicAddress && (
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-text-secondary shrink-0" /> {doc.clinicAddress}
                </span>
              )}
              {doc.consultationFee > 0 && (
                <span className="text-xs font-mono text-emerald-400 font-semibold mt-1">
                  Consultation Fee: ${doc.consultationFee} / session
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
