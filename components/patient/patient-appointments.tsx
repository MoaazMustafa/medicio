"use client";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  TextArea,
} from "@heroui/react";
import {
  AlertCircle,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarX,
  Check,
  Clock,
  RefreshCw,
  Search,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import NextLink from "next/link";
import React, { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DoctorResult {
  id: string;
  name?: string;
  specialty?: string;
  education?: string;
  experience?: number;
  isVerified?: boolean;
  clinicAddress?: string;
  consultationFee?: number;
  availability?: string;
  user?: { id?: string; name?: string; email?: string; avatarUrl?: string };
  hospital?: { name?: string; location?: string };
}

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  notes?: string;
  createdAt: string;
  patient?: { id?: string; name?: string; email?: string; avatarUrl?: string };
  doctor?: {
    id: string;
    specialty?: string;
    experience?: number;
    clinicAddress?: string;
    consultationFee?: number;
    user?: { name?: string; email?: string };
    hospital?: { name?: string; location?: string };
  };
}

type StatusFilter = "ALL" | "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

const STATUS_COLORS: Record<string, "default" | "accent" | "success" | "danger" | "warning"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  COMPLETED: "success",
  CANCELLED: "danger",
};

function formatDateTime(dt: string) {
  try {
    return new Date(dt).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dt;
  }
}

function getDoctorName(doc?: { name?: string; user?: { name?: string } } | null): string {
  if (!doc) return "Doctor";
  return doc.name || doc.user?.name || "Doctor";
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Booking modal
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [doctorResults, setDoctorResults] = useState<DoctorResult[]>([]);
  const [searchingDoctors, setSearchingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorResult | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

  // Cancel confirmation
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (res.ok && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error("Failed to fetch appointments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Doctor search with debounce
  useEffect(() => {
    if (!isBookingOpen) return;
    const t = setTimeout(async () => {
      if (!doctorSearch.trim()) {
        setSearchingDoctors(true);
        try {
          const res = await fetch(`/api/doctors?verified=true`);
          const data = await res.json();
          setDoctorResults(Array.isArray(data.doctors) ? data.doctors : []);
        } catch {
          setDoctorResults([]);
        } finally {
          setSearchingDoctors(false);
        }
        return;
      }
      setSearchingDoctors(true);
      try {
        const res = await fetch(
          `/api/doctors?search=${encodeURIComponent(doctorSearch)}&verified=true`,
        );
        const data = await res.json();
        setDoctorResults(Array.isArray(data.doctors) ? data.doctors : []);
      } catch {
        setDoctorResults([]);
      } finally {
        setSearchingDoctors(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [doctorSearch, isBookingOpen]);

  const openBookingModal = () => {
    setSelectedDoctor(null);
    setDoctorSearch("");
    setDoctorResults([]);
    setBookingDate("");
    setBookingTime("09:00");
    setBookingNotes("");
    setBookingError("");
    setBookingSuccess("");
    setIsBookingOpen(true);
  };

  const handleBook = async () => {
    if (!selectedDoctor || !bookingDate || !bookingTime) {
      setBookingError("Please select a doctor and a date/time.");
      return;
    }
    setIsBooking(true);
    setBookingError("");

    try {
      const dateTime = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          dateTime,
          notes: bookingNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || "Failed to book appointment.");
        return;
      }

      setBookingSuccess(`Appointment request sent to Dr. ${getDoctorName(selectedDoctor)}!`);
      await fetchAppointments();
      setTimeout(() => {
        setIsBookingOpen(false);
        setBookingSuccess("");
      }, 2000);
    } catch {
      setBookingError("Network error. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (id: string) => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        setCancelId(null);
        await fetchAppointments();
      }
    } catch (err) {
      console.error("Cancel error:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const q = searchQuery.toLowerCase();
    const docName = getDoctorName(a.doctor).toLowerCase();
    const specialty = (a.doctor?.specialty || "").toLowerCase();
    const hospitalName = (a.doctor?.hospital?.name || "").toLowerCase();

    const matchesSearch =
      !q || docName.includes(q) || specialty.includes(q) || hospitalName.includes(q);

    const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upcomingCount = appointments.filter(
    (a) => (a.status === "PENDING" || a.status === "CONFIRMED") && new Date(a.dateTime) >= new Date(),
  ).length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;

  const minBookingDate = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Appointments</h1>
            <p className="text-xs text-text-secondary">
              Book consultations with verified Medicio doctors and manage your schedule.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button className="text-xs font-semibold" size="sm" variant="secondary" onPress={fetchAppointments}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button className="text-xs font-semibold" size="sm" variant="primary" onPress={openBookingModal}>
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Book Appointment
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold text-text-primary">{upcomingCount}</span>
          <span className="text-text-secondary">upcoming</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-bold text-text-primary">{confirmedCount}</span>
          <span className="text-text-secondary">confirmed</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border-custom bg-surface/60 px-3 py-1.5 text-xs">
          <CalendarCheck className="h-3.5 w-3.5 text-text-secondary" />
          <span className="font-bold text-text-primary">{appointments.length}</span>
          <span className="text-text-secondary">total</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            className="w-full text-xs"
            placeholder="Search by doctor, specialty, or hospital…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as StatusFilter[]).map((s) => (
            <Button
              key={s}
              className="h-7 shrink-0 px-3 text-[11px] font-semibold"
              size="sm"
              variant={statusFilter === s ? "primary" : "secondary"}
              onPress={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Appointment list */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border-custom bg-surface/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-12 text-center">
          <div className="rounded-2xl border border-border-custom bg-surface/80 p-4 text-text-secondary">
            <CalendarCheck className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No appointments found</h3>
          <p className="max-w-sm text-xs text-text-secondary">
            {searchQuery || statusFilter !== "ALL"
              ? "No appointments match your current filter."
              : "Book your first consultation with a Medicio-verified doctor."}
          </p>
          <Button className="mt-2 text-xs font-semibold" size="sm" variant="primary" onPress={openBookingModal}>
            <CalendarDays className="mr-1 h-3.5 w-3.5" /> Book Appointment
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((appt) => {
            const isPast = new Date(appt.dateTime) < new Date();
            const canCancel = appt.status === "PENDING" || appt.status === "CONFIRMED";

            return (
              <Card
                key={appt.id}
                className="flex flex-col gap-3 border border-border-custom bg-surface/70 p-4 shadow-xs transition-all hover:border-primary/40 sm:flex-row sm:items-start"
              >
                {/* Date block */}
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-border-custom bg-surface/80">
                  <span className="font-mono text-[10px] font-bold uppercase text-text-secondary">
                    {new Date(appt.dateTime).toLocaleDateString(undefined, { month: "short" })}
                  </span>
                  <span className="text-xl font-bold leading-none text-text-primary">
                    {new Date(appt.dateTime).getDate()}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">
                      Dr. {getDoctorName(appt.doctor)}
                    </h3>
                    <Chip
                      className="text-[9px] font-mono font-bold uppercase"
                      color={STATUS_COLORS[appt.status] ?? "default"}
                      size="sm"
                      variant="soft"
                    >
                      {appt.status}
                    </Chip>
                    {isPast && appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                      <Chip className="text-[9px] font-mono font-bold uppercase" color="default" size="sm" variant="soft">
                        Past
                      </Chip>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                    {appt.doctor?.specialty && (
                      <span className="flex items-center gap-1">
                        <Stethoscope className="h-3 w-3 text-primary" />
                        {appt.doctor.specialty}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {formatDateTime(appt.dateTime)}
                    </span>
                    {appt.doctor?.hospital?.name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-primary" />
                        {appt.doctor.hospital.name}
                      </span>
                    )}
                    {appt.doctor?.clinicAddress && (
                      <span className="text-text-secondary">{appt.doctor.clinicAddress}</span>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="mt-1.5 text-xs text-text-secondary">
                      <span className="font-semibold">Notes:</span> {appt.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {canCancel && (
                  <div className="shrink-0">
                    <Button
                      className="h-8 border border-red-500/30 bg-red-500/10 px-3 text-[11px] font-semibold text-red-500 hover:bg-red-500/20"
                      size="sm"
                      variant="secondary"
                      onPress={() => setCancelId(appt.id)}
                    >
                      <CalendarX className="mr-1.5 h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Booking Modal ─────────────────────────────────────────────────── */}
      {isBookingOpen && (
        <Modal.Root isOpen={isBookingOpen} onOpenChange={() => setIsBookingOpen(false)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Book Appointment
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-5 py-2">
                {bookingError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {bookingError}
                  </div>
                )}
                {bookingSuccess && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    {bookingSuccess}
                  </div>
                )}

                {/* Step 1: Doctor search */}
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-text-secondary">
                    {selectedDoctor ? "Selected Doctor" : "Search for a Doctor"}
                  </Label>

                  {selectedDoctor ? (
                    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-primary">
                          Dr. {getDoctorName(selectedDoctor)}
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          {selectedDoctor.specialty || "General Practice"}
                          {selectedDoctor.hospital?.name && ` · ${selectedDoctor.hospital.name}`}
                        </p>
                        {selectedDoctor.consultationFee !== undefined && (
                          <p className="font-mono text-[10px] text-primary">
                            Fee: PKR {selectedDoctor.consultationFee}
                          </p>
                        )}
                      </div>
                      <Button
                        isIconOnly
                        className="h-7 w-7 min-w-7 rounded-full border-0 bg-transparent text-text-secondary"
                        size="sm"
                        variant="secondary"
                        onPress={() => setSelectedDoctor(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder="Search by name or specialty…"
                        value={doctorSearch}
                        onChange={(e) => setDoctorSearch(e.target.value)}
                      />

                      <div className="max-h-52 overflow-y-auto rounded-xl border border-border-custom">
                        {searchingDoctors ? (
                          <div className="flex flex-col gap-1.5 p-2">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface/60" />
                            ))}
                          </div>
                        ) : doctorResults.length === 0 ? (
                          <div className="p-4 text-center text-xs text-text-secondary">
                            No verified doctors found. Try a different search.
                          </div>
                        ) : (
                          <div className="flex flex-col divide-y divide-border-custom">
                            {doctorResults.slice(0, 8).map((doc) => (
                              <button
                                key={doc.id}
                                className="flex items-center gap-3 p-3 text-left transition-colors hover:bg-primary/5"
                                type="button"
                                onClick={() => setSelectedDoctor(doc)}
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border-custom bg-surface/80 text-text-secondary">
                                  <User className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-text-primary">
                                    Dr. {getDoctorName(doc)}
                                    {doc.isVerified && (
                                      <span className="ml-1.5 font-mono text-[9px] text-emerald-500 uppercase">
                                        ✓ Verified
                                      </span>
                                    )}
                                  </p>
                                  <p className="truncate text-[11px] text-text-secondary">
                                    {doc.specialty || "General Practice"}
                                    {doc.hospital?.name && ` · ${doc.hospital.name}`}
                                  </p>
                                </div>
                                {doc.consultationFee !== undefined && (
                                  <span className="shrink-0 font-mono text-[10px] text-primary">
                                    PKR {doc.consultationFee}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Step 2: Date & Time */}
                {selectedDoctor && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold text-text-secondary">Date *</Label>
                      <Input
                        min={minBookingDate}
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-semibold text-text-secondary">Time *</Label>
                      <Input
                        type="time"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Notes */}
                {selectedDoctor && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold text-text-secondary">
                      Notes / Reason (optional)
                    </Label>
                    <TextArea
                      className="min-h-[80px] text-xs"
                      placeholder="Briefly describe your main concern or reason for visiting…"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    />
                  </div>
                )}
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-between border-t border-border-custom pt-4">
                <NextLink href="/chatbot">
                  <Button className="text-xs font-semibold" size="sm" variant="secondary">
                    AI Symptom Checker
                  </Button>
                </NextLink>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onPress={() => setIsBookingOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    isDisabled={!selectedDoctor || !bookingDate || !bookingTime || !!bookingSuccess || isBooking}
                    size="sm"
                    variant="primary"
                    onPress={handleBook}
                  >
                    {isBooking ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      "Confirm Booking"
                    )}
                  </Button>
                </div>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

      {/* ─── Cancel Confirmation ───────────────────────────────────────────── */}
      {cancelId && (
        <Modal.Root isOpen={!!cancelId} onOpenChange={() => setCancelId(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit w-full max-w-sm flex-col gap-4 rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-red-500">
                  <CalendarX className="h-4 w-4" /> Cancel Appointment
                </h3>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="py-2 text-xs text-text-secondary">
                Are you sure you want to cancel this appointment? The doctor will be notified.
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="secondary" onPress={() => setCancelId(null)}>
                  Keep it
                </Button>
                <Button
                  className="bg-red-500 text-white hover:bg-red-600"
                  isDisabled={isCancelling}
                  size="sm"
                  variant="primary"
                  onPress={() => handleCancel(cancelId!)}
                >
                  {isCancelling ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    "Yes, Cancel"
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}
    </div>
  );
}
