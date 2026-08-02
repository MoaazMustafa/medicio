"use client";

import { Button, Card, Chip, Input, Label, TextArea, Modal } from "@heroui/react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileText,
  XCircle,
  AlertCircle,
  Edit3,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Award,
  X,
} from "lucide-react";
import React, { useState } from "react";

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
    doctorData,
  } = useDoctorContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await handleSaveProfile();
    if (success) {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Single Top Toolbar Line: Status Badge + Primary Action Button */}
      <div className="flex items-center justify-between gap-4 border-b border-border-custom pb-4 flex-wrap">
        <div className="flex items-center gap-3">
          {isVerified ? (
            <Chip color="success" variant="soft" className="font-semibold text-xs py-1 px-3">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
              Verified Practitioner Credentials Active
            </Chip>
          ) : isRejected ? (
            <Chip color="danger" variant="soft" className="font-semibold text-xs py-1 px-3">
              <XCircle className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
              Application Rejected — Resubmission Required
            </Chip>
          ) : isProfileSubmitted ? (
            <Chip color="warning" variant="soft" className="font-semibold text-xs py-1 px-3">
              <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
              Credentials Submitted — Pending Review
            </Chip>
          ) : (
            <Chip color="danger" variant="soft" className="font-semibold text-xs py-1 px-3">
              <Lock className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
              Compulsory Verification Required
            </Chip>
          )}
        </div>

        {/* Single Primary Action Button */}
        <Button
          variant="primary"
          className={`font-semibold text-xs flex items-center gap-2 px-5 py-2 rounded-xl shadow-sm ${
            isRejected ? "bg-rose-600 hover:bg-rose-500 text-white" : ""
          }`}
          onPress={() => setIsModalOpen(true)}
        >
          {isRejected ? (
            <>
              <Edit3 className="w-4 h-4" /> Edit & Resubmit Application
            </>
          ) : isProfileSubmitted ? (
            <>
              <Edit3 className="w-4 h-4" /> Edit Credentials Application
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" /> Create & Submit Application
            </>
          )}
        </Button>
      </div>

      {/* Loaded Application Details Card */}
      <Card className="p-6 border border-border-custom bg-surface/50 backdrop-blur-md flex flex-col gap-5 shadow-sm rounded-2xl">
        <div className="flex items-center justify-between border-b border-border-custom pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">Loaded Application Credentials</h3>
          </div>

          <div className="flex items-center gap-2">
            {doctorData && (
              <Button
                variant="secondary"
                size="sm"
                className="text-xs font-semibold px-3 py-1 rounded-lg"
                onPress={() => setIsModalOpen(true)}
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Application
              </Button>
            )}
          </div>
        </div>

        {isRejected && (
          <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 flex flex-col gap-2 text-xs text-rose-200">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Rejection Feedback from Audit</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background-custom/80 border border-rose-500/30 font-mono text-rose-200">
              {rejectionReason || "Credentials failed verification audit."}
            </div>
          </div>
        )}

        {doctorData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col gap-2.5">
              <span className="font-bold text-text-primary text-sm border-b border-border-custom/50 pb-2 flex items-center justify-between">
                <span>Practitioner Credentials</span>
                <Chip
                  variant="soft"
                  color={isVerified ? "success" : isRejected ? "danger" : "warning"}
                  className="text-[9px] font-mono uppercase font-bold"
                >
                  {isVerified ? "Verified" : isRejected ? "Rejected" : "Pending Review"}
                </Chip>
              </span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Primary Specialty:</strong> {doctorData.specialty}
              </span>
              {doctorData.subSpecialty && (
                <span className="text-text-secondary">
                  <strong className="text-text-primary">Sub-Specialty:</strong> {doctorData.subSpecialty}
                </span>
              )}
              <span className="text-text-secondary">
                <strong className="text-text-primary">Education:</strong> {doctorData.education}
              </span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Active Experience:</strong> {doctorData.experience} Years
              </span>
            </div>

            <div className="p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col gap-2.5">
              <span className="font-bold text-text-primary text-sm border-b border-border-custom/50 pb-2">
                Licensing & Authenticity Data
              </span>
              <span className="text-text-secondary font-mono">
                <strong className="text-text-primary font-sans">Medical License #:</strong> {doctorData.licenseNumber}
              </span>
              {doctorData.issuingBoard && (
                <span className="text-text-secondary">
                  <strong className="text-text-primary">Issuing Board / Council:</strong> {doctorData.issuingBoard}
                </span>
              )}
              {doctorData.nationalIdNumber && (
                <span className="text-text-secondary font-mono">
                  <strong className="text-text-primary font-sans">National ID / CNIC #:</strong> {doctorData.nationalIdNumber}
                </span>
              )}
              {doctorData.documentUrl && (
                <span className="text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <strong className="text-text-primary">Certificate Link:</strong>
                  <a
                    href={doctorData.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View PDF Document
                  </a>
                </span>
              )}
            </div>

            <div className="md:col-span-2 p-4 rounded-xl bg-background-custom/40 border border-border-custom/80 flex flex-col gap-2">
              <span className="font-bold text-text-primary text-sm border-b border-border-custom/50 pb-2">
                Practice Location & Consultation
              </span>
              <span className="text-text-secondary">
                <strong className="text-text-primary">Clinic Address:</strong> {doctorData.clinicAddress || "Not specified"}
              </span>
              <span className="text-text-secondary font-mono">
                <strong className="text-text-primary font-sans">Consultation Fee:</strong> ${doctorData.consultationFee || 50} / Session
              </span>
              {doctorData.bio && (
                <p className="text-text-secondary mt-1 leading-relaxed">
                  <strong className="text-text-primary">Biography:</strong> {doctorData.bio}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs flex flex-col items-center gap-2">
            <FileText className="w-8 h-8 text-text-secondary/50" />
            <span className="font-bold text-text-primary">No Registered Application Loaded</span>
            <span>Click the primary button at the top right to create and submit your medical verification application.</span>
          </div>
        )}
      </Card>

      {/* Application Submission History Log */}
      <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-4 shadow-sm rounded-2xl">
        <div className="border-b border-border-custom pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-text-primary">Application Submission History Log</h3>
          </div>
          <Chip variant="soft" color="accent" className="text-[10px] font-mono font-bold">
            {applicationHistories.length} Historical Submissions
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
                  <div className="flex items-center gap-4 text-text-secondary text-[11px] font-mono flex-wrap">
                    <span>License #: {hist.licenseNumber}</span>
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
                      Appeal Note: {hist.reviewNotes}
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

      {/* HeroUI Modal for Creating/Editing Verification Application */}
      {isModalOpen && (
        <Modal.Root isOpen={isModalOpen} onOpenChange={setIsModalOpen}>
          <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 outline-none animate-in fade-in">
            <Modal.Dialog className="w-full max-w-2xl h-fit max-h-[90vh] overflow-y-auto p-6 bg-surface border border-border-custom rounded-2xl shadow-2xl flex flex-col gap-4 outline-none pointer-events-auto text-text-primary">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-base font-bold text-text-primary">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span>
                      {isRejected
                        ? "Edit & Resubmit Verification Application"
                        : isProfileSubmitted
                        ? "Update Credentials Application"
                        : "Create & Submit Verification Application"}
                    </span>
                  </div>
                  <p className="text-xs font-normal text-text-secondary">
                    Complete all clinical licensing, medical council, and national identity authenticity details for administrator review.
                  </p>
                </div>
                <Modal.CloseTrigger className="text-text-secondary hover:text-text-primary p-1">
                  <X className="w-4 h-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="py-2">
                <form id="doc-app-modal-form" onSubmit={handleSubmitModal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isRejected && (
                    <div className="md:col-span-2 p-3 rounded-xl border border-rose-500/40 bg-rose-950/40 flex flex-col gap-1.5 text-xs text-rose-200">
                      <div className="flex items-center gap-1.5 font-bold text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Rejection Feedback & Appeal Notes</span>
                      </div>
                      <div className="p-2 rounded-lg bg-background-custom/80 border border-rose-500/30 font-mono text-xs">
                        {rejectionReason || "Credentials failed verification audit."}
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <Label className="text-xs font-semibold text-rose-200">Re-Evaluation Note for Administrator</Label>
                        <Input
                          placeholder="Provide context or explain updates for admin re-evaluation..."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Medical Specialty *</Label>
                    <Input
                      placeholder="e.g. Cardiology, Pediatrics, Neurology"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Sub-Specialty / Clinical Focus</Label>
                    <Input
                      placeholder="e.g. Interventional Cardiology"
                      value={subSpecialty}
                      onChange={(e) => setSubSpecialty(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Education & Qualifications *</Label>
                    <Input
                      placeholder="e.g. MD - Johns Hopkins University, FACC"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Years of Active Experience *</Label>
                    <Input
                      type="number"
                      value={String(experience)}
                      onChange={(e) => setExperience(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Medical License Number *</Label>
                    <Input
                      placeholder="e.g. LIC-102938475"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Medical Council / Issuing Board</Label>
                    <Input
                      placeholder="e.g. State Medical Board, PMDC, GMC"
                      value={issuingBoard}
                      onChange={(e) => setIssuingBoard(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">National ID / CNIC / Passport #</Label>
                    <Input
                      placeholder="e.g. 42101-1234567-8"
                      value={nationalIdNumber}
                      onChange={(e) => setNationalIdNumber(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Verification Document Link (PDF)</Label>
                    <Input
                      placeholder="e.g. https://certificates.org/license.pdf"
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-primary">Clinic Address</Label>
                    <Input
                      placeholder="e.g. Suite 402, Medical Arts Building"
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
                    <Label className="text-xs font-semibold text-text-primary">Biography & Summary</Label>
                    <TextArea
                      placeholder="Describe your clinical focus, background, and patient care philosophy..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>
                </form>
              </Modal.Body>

              <Modal.Footer className="border-t border-border-custom flex items-center justify-end gap-2 pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setIsModalOpen(false)}
                  className="text-xs font-semibold px-4"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  form="doc-app-modal-form"
                  isDisabled={saving}
                  className={`text-xs font-semibold px-5 ${
                    isRejected ? "bg-rose-600 hover:bg-rose-500 text-white" : ""
                  }`}
                >
                  {saving
                    ? "Saving Credentials..."
                    : isRejected
                    ? "Submit Re-Evaluation & Resubmit Application"
                    : "Save & Submit Credentials for Verification"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </div>
  );
}
