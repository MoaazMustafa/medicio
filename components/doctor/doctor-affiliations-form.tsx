"use client";

import React from "react";
import { Button, Card, Chip, Input, Label } from "@heroui/react";
import { Building2, MapPin } from "lucide-react";
import { useDoctorContext } from "./doctor-context";

export function DoctorAffiliationsForm() {
  const {
    doctorData,
    selectedHospitalId,
    setSelectedHospitalId,
    handleAffiliationAction,
  } = useDoctorContext();

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3">
        <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span>Bidirectional Hospital Affiliation Hub</span>
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          FR-DOC-05: Bidirectional requests — doctors can request affiliation with a hospital, and hospitals can request registered doctors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-surface/60 border border-border-custom flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary uppercase font-mono">Current Affiliation State</h3>
          {doctorData?.hospital ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1">
                  <Building2 className="w-5 h-5" /> {doctorData.hospital.name}
                </span>
                <Chip variant="soft" color="success" className="text-[10px]">
                  {doctorData.affiliationStatus || "AFFILIATED"}
                </Chip>
              </div>
              <p className="text-xs text-text-secondary flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {doctorData.hospital.location}
              </p>
              <p className="text-xs text-text-secondary mt-2">
                Your listed clinic profile is linked to {doctorData.hospital.name}. You retain direct control over your own availability timetable (FR-DOC-04).
              </p>

              <Button
                variant="danger"
                size="sm"
                className="w-fit text-xs mt-3 font-semibold"
                onPress={() => handleAffiliationAction("TERMINATE")}
              >
                Terminate Hospital Affiliation
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-amber-400">Independent Practitioner</span>
              <p className="text-xs text-text-secondary">
                You are currently registered as an independent practitioner without active hospital affiliation.
              </p>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl bg-surface/60 border border-border-custom flex flex-col gap-4">
          <h3 className="text-xs font-bold text-text-primary uppercase font-mono">Request Hospital Affiliation</h3>
          <p className="text-xs text-text-secondary">
            Submit an affiliation request to a hospital registered on Medicio.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Hospital Unique ID</Label>
              <Input
                placeholder="Enter Hospital ID (e.g. cjld2cj...)"
                value={selectedHospitalId}
                onChange={(e) => setSelectedHospitalId(e.target.value)}
              />
            </div>

            <Button
              variant="primary"
              className="text-xs font-semibold"
              onPress={() => handleAffiliationAction("REQUEST_HOSPITAL")}
            >
              Send Affiliation Request
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
