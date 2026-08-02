"use client";

import { Button, Card, Chip, Input, Skeleton } from "@heroui/react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Archive,
  ExternalLink,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import React, { useEffect, useState } from "react";

export function AdminVerificationsManager() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "rejected" | "approved" | "archived">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReasonMap, setRejectionReasonMap] = useState<{ [id: string]: string }>({});
  const [toast, setToast] = useState<string | null>(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctors?includeScraped=false");
      const data = await res.json();
      if (data.doctors) {
        setDoctors(data.doctors);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleAction = async (doctorId: string, action: "approve" | "reject" | "archive") => {
    setProcessingId(doctorId);
    try {
      const reason = rejectionReasonMap[doctorId] || "";
      const res = await fetch("/api/doctors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          action,
          approve: action === "approve",
          rejectionReason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification action failed");

      setToast(data.message);
      setTimeout(() => setToast(null), 4000);
      setRejectionReasonMap((prev) => ({ ...prev, [doctorId]: "" }));
      fetchDoctors();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingDoctors = doctors.filter(
    (d) =>
      !d.isVerified &&
      (d.verificationStatus === "PENDING" || !d.verificationStatus || d.isReviewRequested) &&
      d.specialty &&
      d.licenseNumber
  );

  const rejectedDoctors = doctors.filter((d) => d.verificationStatus === "REJECTED" && !d.isVerified);
  const approvedDoctors = doctors.filter((d) => d.isVerified || d.verificationStatus === "APPROVED");
  const archivedDoctors = doctors.filter((d) => d.verificationStatus === "ARCHIVED");

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Card className="p-6 border border-border-custom bg-surface/50 flex flex-col gap-4">
          <Skeleton className="h-6 w-72 rounded" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border bg-emerald-950/90 border-emerald-500 text-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Telemetry metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-amber-400 font-semibold">Pending Review</span>
          <span className="text-3xl font-extrabold text-text-primary">{pendingDoctors.length} Requests</span>
          <p className="text-[11px] text-text-secondary">Awaiting initial audit or doctor review request.</p>
        </Card>

        <Card className="p-4 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-rose-400 font-semibold">Rejected Applications</span>
          <span className="text-3xl font-extrabold text-text-primary">{rejectedDoctors.length} Applications</span>
          <p className="text-[11px] text-text-secondary">Denied applications pending doctor appeal or re-audit.</p>
        </Card>

        <Card className="p-4 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Verified Active</span>
          <span className="text-3xl font-extrabold text-text-primary">{approvedDoctors.length} Practitioners</span>
          <p className="text-[11px] text-text-secondary">Fully credentialed & verified active doctors.</p>
        </Card>

        <Card className="p-4 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-text-secondary font-semibold">Archived Requests</span>
          <span className="text-3xl font-extrabold text-text-primary">{archivedDoctors.length} Archived</span>
          <p className="text-[11px] text-text-secondary">Archived verification history records.</p>
        </Card>
      </div>

      {/* Tabs & Main Queue */}
      <Card className="p-6 border border-border-custom bg-surface/50 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-text-primary">Doctor Credential Verification Manager</h2>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="text-xs font-semibold" onPress={fetchDoctors}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border-custom pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <ClipboardList className="w-4 h-4 text-amber-400" />
            <span>Pending Queue</span>
            <Chip size="sm" variant="soft" color="warning" className="text-[10px] px-1 font-mono">
              {pendingDoctors.length}
            </Chip>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "rejected"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Rejected Applications</span>
            <Chip size="sm" variant="soft" color="danger" className="text-[10px] px-1 font-mono">
              {rejectedDoctors.length}
            </Chip>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "approved"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Approved Practitioners</span>
            <Chip size="sm" variant="soft" color="success" className="text-[10px] px-1 font-mono">
              {approvedDoctors.length}
            </Chip>
          </button>

          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "archived"
                ? "bg-surface/80 text-text-primary border border-border-custom"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Archive className="w-4 h-4 text-text-secondary" />
            <span>Archived Records</span>
            <Chip size="sm" variant="soft" color="default" className="text-[10px] px-1 font-mono">
              {archivedDoctors.length}
            </Chip>
          </button>
        </div>

        {/* Tab 1: Pending Queue */}
        {activeTab === "pending" && (
          <div>
            {pendingDoctors.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs">
                No pending doctor credential verification requests in queue.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {pendingDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl bg-surface/80 border border-amber-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 text-xs flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-primary text-base">Dr. {doc.name}</span>
                        <Chip color="warning" variant="soft" className="text-[10px] uppercase font-mono font-bold">
                          Pending Review
                        </Chip>
                        {doc.isReviewRequested && (
                          <Chip color="danger" variant="soft" className="text-[10px] uppercase font-mono font-bold">
                            Reviewal / Appeal Requested
                          </Chip>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl bg-background-custom/40 border border-border-custom/80 text-xs">
                        <span>
                          <strong className="text-text-primary">Specialty:</strong> {doc.specialty}
                        </span>
                        {doc.subSpecialty && (
                          <span>
                            <strong className="text-text-primary">Sub-Specialty:</strong> {doc.subSpecialty}
                          </span>
                        )}
                        <span>
                          <strong className="text-text-primary">Education:</strong> {doc.education}
                        </span>
                        <span>
                          <strong className="text-text-primary">Experience:</strong> {doc.experience} Years
                        </span>
                        <span className="font-mono">
                          <strong className="text-text-primary font-sans">License #:</strong> {doc.licenseNumber}
                        </span>
                        {doc.issuingBoard && (
                          <span>
                            <strong className="text-text-primary">Issuing Board:</strong> {doc.issuingBoard}
                          </span>
                        )}
                        {doc.nationalIdNumber && (
                          <span className="font-mono">
                            <strong className="text-text-primary font-sans">National ID #:</strong> {doc.nationalIdNumber}
                          </span>
                        )}
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-semibold flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Certificate PDF
                          </a>
                        )}
                      </div>

                      {doc.reviewNotes && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                          <strong>Doctor Review Request Note:</strong> {doc.reviewNotes}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 mt-1">
                        <Input
                          placeholder="Reason if rejecting application..."
                          value={rejectionReasonMap[doc.id] || ""}
                          onChange={(e) =>
                            setRejectionReasonMap((prev) => ({ ...prev, [doc.id]: e.target.value }))
                          }
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-semibold"
                        isDisabled={processingId === doc.id}
                        onPress={() => handleAction(doc.id, "approve")}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                        {processingId === doc.id ? "Processing..." : "Approve Credentials"}
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs font-semibold"
                        isDisabled={processingId === doc.id}
                        onPress={() => handleAction(doc.id, "reject")}
                      >
                        <XCircle className="w-4 h-4 mr-1 text-rose-400" />
                        {processingId === doc.id ? "Processing..." : "Reject Application"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-text-secondary border-border-custom"
                        isDisabled={processingId === doc.id}
                        onPress={() => handleAction(doc.id, "archive")}
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive Application
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Rejected Applications */}
        {activeTab === "rejected" && (
          <div>
            {rejectedDoctors.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs">
                No rejected doctor applications recorded.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {rejectedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-2xl bg-surface/80 border border-rose-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 text-xs flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-text-primary text-base">Dr. {doc.name}</span>
                        <Chip color="danger" variant="soft" className="text-[10px] uppercase font-mono font-bold">
                          Rejected Application
                        </Chip>
                        {doc.isReviewRequested && (
                          <Chip color="warning" variant="soft" className="text-[10px] uppercase font-mono font-bold">
                            Doctor Requested Review
                          </Chip>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs font-mono">
                        <strong>Rejection Reason Recorded:</strong> {doc.rejectionReason || "Credentials failed verification audit."}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-xl bg-background-custom/40 border border-border-custom/80 text-xs">
                        <span>
                          <strong className="text-text-primary">Specialty:</strong> {doc.specialty}
                        </span>
                        <span>
                          <strong className="text-text-primary">Education:</strong> {doc.education}
                        </span>
                        <span className="font-mono">
                          <strong className="text-text-primary font-sans">License #:</strong> {doc.licenseNumber}
                        </span>
                        {doc.issuingBoard && (
                          <span>
                            <strong className="text-text-primary">Issuing Board:</strong> {doc.issuingBoard}
                          </span>
                        )}
                        {doc.nationalIdNumber && (
                          <span className="font-mono">
                            <strong className="text-text-primary font-sans">National ID #:</strong> {doc.nationalIdNumber}
                          </span>
                        )}
                        {doc.documentUrl && (
                          <a
                            href={doc.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-semibold flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Certificate Document
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        isDisabled={processingId === doc.id}
                        onPress={() => handleAction(doc.id, "approve")}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Re-evaluate & Approve
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold border-border-custom text-text-secondary"
                        isDisabled={processingId === doc.id}
                        onPress={() => handleAction(doc.id, "archive")}
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        Archive Application
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Approved Practitioners */}
        {activeTab === "approved" && (
          <div>
            {approvedDoctors.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs">
                No active verified doctors.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {approvedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-surface/60 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">Dr. {doc.name}</span>
                        <Chip color="success" variant="soft" className="text-[10px] uppercase font-mono font-bold">
                          Verified Active
                        </Chip>
                      </div>
                      <span className="text-text-secondary">
                        {doc.specialty} • {doc.education} • License: {doc.licenseNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs font-semibold"
                        isDisabled={processingId === doc.id}
                        onPress={() => handleAction(doc.id, "reject")}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Unverify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Archived Records */}
        {activeTab === "archived" && (
          <div>
            {archivedDoctors.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs">
                No archived application records.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {archivedDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-xl bg-surface/40 border border-border-custom flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary text-sm">Dr. {doc.name}</span>
                        <Chip color="default" variant="soft" className="text-[10px] uppercase font-mono font-bold">
                          Archived
                        </Chip>
                      </div>
                      <span className="text-text-secondary">
                        {doc.specialty} • License: {doc.licenseNumber}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold border-border-custom text-primary"
                      isDisabled={processingId === doc.id}
                      onPress={() => handleAction(doc.id, "reject")}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" /> Restore to Queue
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
