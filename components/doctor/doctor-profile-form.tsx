"use client";

import React from "react";
import { Button, Card, Chip, Input, Label, TextArea } from "@heroui/react";
import { ShieldCheck, ShieldAlert, Lock, FileText, XCircle, AlertCircle } from "lucide-react";
import { useDoctorContext } from "./doctor-context";

export function DoctorProfileForm() {
  const {
    specialty,
    setSpecialty,
    subSpecialty,
    setSubSpecialty,
    education,
    setEducation,
    experience,
    setExperience,
    licenseNumber,
    setLicenseNumber,
    issuingBoard,
    setIssuingBoard,
    nationalIdNumber,
    setNationalIdNumber,
    documentUrl,
    setDocumentUrl,
    reviewNotes,
    setReviewNotes,
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
    isRejected,
    rejectionReason,
    applicationHistories,
  } = useDoctorContext();

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6 shadow-sm">
        <div className="border-b border-border-custom pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Submit & Update Medical Credentials</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              FR-DOC-01: Submit credentials, medical council licensing, national ID, and certificate links for administrator verification.
            </p>
          </div>

          {isVerified ? (
            <Chip color="success" variant="soft" className="font-semibold text-xs shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 inline mr-1 text-emerald-400" />
              Verified Practitioner Credentials
            </Chip>
          ) : isRejected ? (
            <Chip color="danger" variant="soft" className="font-semibold text-xs shrink-0 flex items-center gap-1">
              <XCircle className="w-4 h-4 inline mr-1 text-rose-400" />
              Application Rejected — Resubmit Required
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

        {isRejected && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 flex flex-col gap-2 text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Previous Verification Audit Rejected</span>
            </div>
            <p className="text-text-secondary">
              Your previous credential submission was rejected by an administrator for the following reason:
            </p>
            <div className="p-2.5 rounded-lg bg-background-custom/80 border border-rose-500/30 font-mono text-rose-200 font-semibold">
              Rejection Feedback: {rejectionReason || "Credentials failed verification audit."}
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <Label className="text-xs font-semibold text-rose-200">Reviewal / Appeal Request Notes for Administrator</Label>
              <Input
                placeholder="Explain updates or provide additional context for admin re-evaluation..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>
          </div>
        )}

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
            <Label className="text-xs font-semibold text-text-primary">Sub-Specialty / Clinical Focus (Optional)</Label>
            <Input
              placeholder="e.g. Interventional Cardiology, Pediatric Oncology"
              value={subSpecialty}
              onChange={(e) => setSubSpecialty(e.target.value)}
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
            <Label className="text-xs font-semibold text-text-primary">Years of Active Experience</Label>
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
            <Label className="text-xs font-semibold text-text-primary">Medical Council / Issuing Board (Authenticity)</Label>
            <Input
              placeholder="e.g. State Medical Board, PMDC, General Medical Council"
              value={issuingBoard}
              onChange={(e) => setIssuingBoard(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">National ID / Passport Number (Identity Authenticity)</Label>
            <Input
              placeholder="e.g. CNIC / Passport # 42101-1234567-8"
              value={nationalIdNumber}
              onChange={(e) => setNationalIdNumber(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-text-primary">Verification Document / Certificate Link (Authenticity)</Label>
            <Input
              placeholder="e.g. https://certificates.org/my-license.pdf"
              value={documentUrl}
              onChange={(e) => setDocumentUrl(e.target.value)}
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
              {saving
                ? "Saving Credentials..."
                : isRejected
                ? "Submit Re-Evaluation & Resubmit Credentials"
                : "Save & Submit Credentials for Verification"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Application Submission History Log */}
      <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-4 shadow-sm">
        <div className="border-b border-border-custom pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-text-primary">Application Submission History Log</h3>
          </div>
          <Chip variant="soft" color="accent" className="text-[10px] font-mono font-bold">
            {applicationHistories.length} Historical Records
          </Chip>
        </div>

        {applicationHistories.length === 0 ? (
          <p className="text-xs text-text-secondary italic">No previous application history recorded yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {applicationHistories.map((hist: any, index: number) => (
              <div
                key={hist.id || index}
                className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary text-sm">{hist.specialty}</span>
                    {hist.subSpecialty && (
                      <span className="text-[11px] text-text-secondary">({hist.subSpecialty})</span>
                    )}
                    <Chip
                      variant="soft"
                      color={
                        hist.status === "APPROVED"
                          ? "success"
                          : hist.status === "REJECTED"
                          ? "danger"
                          : hist.status === "ARCHIVED"
                          ? "default"
                          : "warning"
                      }
                      className="text-[9px] font-mono uppercase font-bold"
                    >
                      {hist.status}
                    </Chip>
                  </div>
                  <div className="flex items-center gap-4 text-text-secondary text-[11px] font-mono">
                    <span>License: {hist.licenseNumber}</span>
                    {hist.issuingBoard && <span>Board: {hist.issuingBoard}</span>}
                    {hist.nationalIdNumber && <span>ID: {hist.nationalIdNumber}</span>}
                  </div>
                  {hist.rejectionReason && (
                    <div className="text-[11px] text-rose-300 font-mono mt-1">
                      Reason: {hist.rejectionReason}
                    </div>
                  )}
                  {hist.reviewNotes && (
                    <div className="text-[11px] text-amber-300 font-mono">
                      Doctor Review Request Note: {hist.reviewNotes}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-text-secondary font-mono shrink-0">
                  {new Date(hist.submittedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
