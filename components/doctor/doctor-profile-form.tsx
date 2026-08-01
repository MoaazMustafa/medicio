"use client";

import React from "react";
import { Button, Card, Chip, Input, Label, TextArea } from "@heroui/react";
import { ShieldCheck, ShieldAlert, Lock, FileText } from "lucide-react";
import { useDoctorContext } from "./doctor-context";

export function DoctorProfileForm() {
  const {
    specialty,
    setSpecialty,
    education,
    setEducation,
    experience,
    setExperience,
    licenseNumber,
    setLicenseNumber,
    clinicAddress,
    setClinicAddress,
    consultationFee,
    setConsultationFee,
    bio,
    setBio,
    handleSaveProfile,
    saving,
    isVerified,
    isProfileSubmitted,
  } = useDoctorContext();

  return (
    <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
      <div className="border-b border-border-custom pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Submit & Update Medical Credentials</span>
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            FR-DOC-01: Submit qualifications and license details for administrator verification. FR-DOC-06: Independent clinic doctors maintain standalone profiles.
          </p>
        </div>

        {isVerified ? (
          <Chip color="success" variant="soft" className="font-semibold text-xs shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 inline mr-1 text-emerald-400" />
            Verified Practitioner Credentials
          </Chip>
        ) : isProfileSubmitted ? (
          <Chip color="warning" variant="soft" className="font-semibold text-xs shrink-0 flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 inline mr-1 text-amber-400" />
            Credentials Submitted & Pending Review
          </Chip>
        ) : (
          <Chip color="danger" variant="soft" className="font-semibold text-xs shrink-0 flex items-center gap-1">
            <Lock className="w-4 h-4 inline mr-1 text-rose-400" />
            Compulsory Form — Not Submitted
          </Chip>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Medical Specialty</Label>
          <Input
            placeholder="e.g. Cardiology, Pediatrics, Neurology"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Education & Qualifications</Label>
          <Input
            placeholder="e.g. MD - Johns Hopkins University, FACC"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Years of Experience</Label>
          <Input
            type="number"
            value={String(experience)}
            onChange={(e) => setExperience(Number(e.target.value))}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Medical License Number</Label>
          <Input
            placeholder="e.g. LIC-102938475"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Clinic Address (Independent Practice)</Label>
          <Input
            placeholder="e.g. Suite 402, Medical Arts Building, Sector-5"
            value={clinicAddress}
            onChange={(e) => setClinicAddress(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Consultation Fee ($)</Label>
          <Input
            type="number"
            placeholder="50"
            value={String(consultationFee)}
            onChange={(e) => setConsultationFee(Number(e.target.value))}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-semibold text-text-primary">Practitioner Biography / Summary</Label>
          <TextArea
            placeholder="Describe your clinical focus, background, and patient care philosophy..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button variant="primary" type="submit" isDisabled={saving} className="px-6 font-semibold text-xs">
            {saving ? "Saving Credentials..." : "Save & Submit Credentials for Verification"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
