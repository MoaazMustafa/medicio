"use client";

import React, { useEffect, useState } from "react";
import { Button, Card, Chip, Input, TextArea } from "@heroui/react";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export function AdminVerificationsManager() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
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

  const handleVerify = async (doctorId: string, approve: boolean) => {
    setProcessingId(doctorId);
    try {
      const res = await fetch("/api/doctors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, approve, rejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification action failed");

      setToast(data.message);
      setTimeout(() => setToast(null), 4000);
      setRejectionReason("");
      fetchDoctors();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const pendingDoctors = doctors.filter((d) => !d.isVerified);
  const verifiedDoctors = doctors.filter((d) => d.isVerified);

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border bg-emerald-950/90 border-emerald-500 text-emerald-200 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-amber-400 font-semibold">Pending Approvals</span>
          <span className="text-3xl font-extrabold text-text-primary">{pendingDoctors.length} Requests</span>
          <p className="text-xs text-text-secondary">Unverified doctor licenses currently awaiting manual admin review.</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">Verified Practitioners</span>
          <span className="text-3xl font-extrabold text-text-primary">{verifiedDoctors.length} Active</span>
          <p className="text-xs text-text-secondary">Fully credentialed doctors active on the Medicio platform.</p>
        </Card>

        <Card className="p-5 border border-border-custom bg-surface/40 flex flex-col gap-2">
          <span className="text-xs font-mono uppercase text-sky-400 font-semibold">Verification SLA</span>
          <span className="text-3xl font-extrabold text-text-primary font-mono">&lt; 24 Hours</span>
          <p className="text-xs text-text-secondary">Target turnaround time for practitioner credential onboarding.</p>
        </Card>
      </div>

      {/* Queue section */}
      <Card className="p-6 border border-border-custom bg-surface/50 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-border-custom pb-3">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <span>Doctor Credential Verification Queue (FR-DOC-02)</span>
          </h2>
          <Button variant="secondary" size="sm" className="text-xs font-semibold" onPress={fetchDoctors}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Queue
          </Button>
        </div>

        {pendingDoctors.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs">
            No pending doctor credential verification requests in queue.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {pendingDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-xl bg-surface/80 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary text-sm">Dr. {doc.name}</span>
                    <Chip color="warning" variant="soft" className="text-[10px] uppercase font-mono font-semibold">
                      Pending Review
                    </Chip>
                  </div>
                  <span className="text-primary font-semibold">Specialty: {doc.specialty}</span>
                  <span className="text-text-secondary">Education: {doc.education}</span>
                  <span className="text-text-secondary">Experience: {doc.experience} Years</span>
                  <span className="text-text-secondary font-mono">License: {doc.licenseNumber}</span>
                  {doc.clinicAddress && <span className="text-text-secondary">Clinic: {doc.clinicAddress}</span>}
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    className="text-xs font-semibold"
                    isDisabled={processingId === doc.id}
                    onPress={() => handleVerify(doc.id, true)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                    {processingId === doc.id ? "Processing..." : "Approve Credentials"}
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    className="text-xs font-semibold"
                    isDisabled={processingId === doc.id}
                    onPress={() => handleVerify(doc.id, false)}
                  >
                    <XCircle className="w-4 h-4 mr-1 text-rose-400" />
                    {processingId === doc.id ? "Processing..." : "Reject Request"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
