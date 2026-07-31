"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, Chip, Input, Label, TextArea } from "@heroui/react";
import {
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building2,
  Bot,
  UserCheck,
  Clock,
  Sparkles,
  Stethoscope,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Send,
  RefreshCw,
  Search,
} from "lucide-react";

type DoctorTabKey =
  | "overview"
  | "profile"
  | "availability"
  | "affiliation"
  | "agent"
  | "appointments"
  | "directory";

export function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [scrapedDirectory, setScrapedDirectory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<DoctorTabKey>("overview");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form states
  const [specialty, setSpecialty] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState(5);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [bio, setBio] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [consultationFee, setConsultationFee] = useState(50);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");

  // Availability state
  const [workingDays, setWorkingDays] = useState<string[]>(["Monday", "Wednesday", "Friday"]);
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00");
  const [slotDuration, setSlotDuration] = useState(30);

  // AI Training state
  const [agentName, setAgentName] = useState("");
  const [agentTone, setAgentTone] = useState("Clinical & Reassuring");
  const [emergencyRedFlags, setEmergencyRedFlags] = useState(
    "Chest pain radiate to arm, Sudden severe shortness of breath, Sudden numbness or loss of speech"
  );
  const [intakeProtocols, setIntakeProtocols] = useState(
    "Ask for onset duration, prior diagnostic history, active medications, and pain intensity scale (1-10)."
  );
  const [practiceBoundaries, setPracticeBoundaries] = useState(
    "Do not prescribe schedule II narcotics over AI; advise emergency department visit for unstable vital signs."
  );
  const [customDisclaimer, setCustomDisclaimer] = useState(
    "This AI agent provides preliminary triage based on Dr. Rahman's clinical protocols. It does not replace emergency medical care."
  );
  const [aiTestPrompt, setAiTestPrompt] = useState("");
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctors/me");
      const data = await res.json();

      if (data.exists && data.doctor) {
        const doc = data.doctor;
        setDoctorData(doc);
        setSpecialty(doc.specialty || "");
        setEducation(doc.education || "");
        setExperience(doc.experience || 0);
        setLicenseNumber(doc.licenseNumber || "");
        setBio(doc.bio || "");
        setClinicAddress(doc.clinicAddress || "");
        setConsultationFee(doc.consultationFee || 50);
        setSelectedHospitalId(doc.hospitalId || "");

        if (doc.availability) {
          setWorkingDays(doc.availability.workingDays || ["Monday", "Wednesday", "Friday"]);
          if (doc.availability.workingHours) {
            const [start, end] = doc.availability.workingHours.split(" - ");
            setWorkingHoursStart(start || "09:00");
            setWorkingHoursEnd(end || "17:00");
          }
          setSlotDuration(doc.availability.slotDurationMinutes || 30);
        }

        if (doc.aiTrainingData) {
          setAgentName(doc.aiTrainingData.agentName || "");
          setAgentTone(doc.aiTrainingData.agentTone || "Clinical & Reassuring");
          if (Array.isArray(doc.aiTrainingData.emergencyRedFlags)) {
            setEmergencyRedFlags(doc.aiTrainingData.emergencyRedFlags.join(", "));
          }
          setIntakeProtocols(doc.aiTrainingData.intakeProtocols || "");
          setPracticeBoundaries(doc.aiTrainingData.practiceBoundaries || "");
          setCustomDisclaimer(doc.aiTrainingData.customDisclaimer || "");
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDirectory = async () => {
    try {
      const res = await fetch("/api/doctors?includeScraped=true");
      const data = await res.json();
      if (data.doctors) {
        setScrapedDirectory(data.doctors);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointments();
    fetchDirectory();
  }, []);

  // Save profile credentials
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialty,
          education,
          experience: Number(experience),
          licenseNumber,
          bio,
          clinicAddress,
          consultationFee: Number(consultationFee),
          hospitalId: selectedHospitalId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      showToast(data.message || "Profile submitted for review");
      fetchDoctorProfile();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Save availability
  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const availabilityPayload = {
        workingDays,
        workingHours: `${workingHoursStart} - ${workingHoursEnd}`,
        slotDurationMinutes: Number(slotDuration),
      };

      const res = await fetch("/api/doctors/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: availabilityPayload }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update availability");

      showToast("Availability schedule updated!");
      fetchDoctorProfile();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Save AI Training
  const handleTrainAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const flagsArray = emergencyRedFlags.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/agents/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agentName || `Dr. ${doctorData?.user?.name || "Practitioner"}'s Bot`,
          agentTone,
          emergencyRedFlags: flagsArray,
          intakeProtocols,
          practiceBoundaries,
          customDisclaimer,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to train agent");

      showToast("Specialty AI Agent trained successfully!");
      fetchDoctorProfile();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle appointment status update
  const handleUpdateAppointment = async (appointmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update appointment");

      showToast(`Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Affiliation actions
  const handleAffiliationAction = async (action: string, targetHospitalId?: string) => {
    try {
      const res = await fetch("/api/doctors/affiliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          hospitalId: targetHospitalId || selectedHospitalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Affiliation action failed");

      showToast(data.message);
      fetchDoctorProfile();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Run AI Test simulator
  const handleTestAgent = async () => {
    if (!aiTestPrompt) return;
    setAiTesting(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setAiTestResult(
        `[${agentName || "Specialty Bot"} Response]: Thank you for reaching out. Based on Dr. ${
          doctorData?.user?.name || "Rahman"
        }'s protocol, please note: ${intakeProtocols.slice(0, 100)}... Disclaimer: ${customDisclaimer}`
      );
    } finally {
      setAiTesting(false);
    }
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const isVerified = doctorData?.isVerified ?? false;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col gap-6">
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border text-sm font-semibold flex items-center gap-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-500 text-emerald-200"
              : "bg-rose-950/90 border-rose-500 text-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-custom pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary flex items-center gap-2">
              <Stethoscope className="w-8 h-8 text-primary" />
              <span>Doctor Control Portal</span>
            </h1>
            {isVerified ? (
              <Chip color="success" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                Verified Practitioner
              </Chip>
            ) : (
              <Chip color="warning" variant="soft" className="font-semibold text-xs flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 inline mr-1" />
                Pending Verification Review
              </Chip>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Manage medical credentials, availability timetable, hospital affiliations, personal specialty AI agent, and patient appointments (M4 Specification).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="text-xs font-semibold" onPress={fetchDoctorProfile}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh Portal Data
          </Button>
        </div>
      </div>

      {/* Verification Notice Banner if unverified */}
      {!isVerified && (
        <Card className="p-5 border border-amber-500/40 bg-amber-500/10 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
            <div>
              <h2 className="text-sm font-bold text-amber-200">
                FR-DOC-02: Credential Verification Pending Admin Review
              </h2>
              <p className="text-xs text-amber-300/80 mt-1">
                Your medical license and education credentials have been submitted and are currently in the review queue.
              </p>
            </div>
          </div>
          <Button variant="primary" className="text-xs font-semibold whitespace-nowrap" onPress={() => setActiveTab("profile")}>
            Review Submitted Credentials
          </Button>
        </Card>
      )}

      {/* HeroUI Tab Buttons */}
      <div className="flex items-center gap-2 border-b border-border-custom pb-3 overflow-x-auto">
        <Button
          variant={activeTab === "overview" ? "primary" : "outline"}
          onPress={() => setActiveTab("overview")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Overview</span>
        </Button>

        <Button
          variant={activeTab === "profile" ? "primary" : "outline"}
          onPress={() => setActiveTab("profile")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>Credentials & Profile (FR-DOC-01/06)</span>
        </Button>

        <Button
          variant={activeTab === "availability" ? "primary" : "outline"}
          onPress={() => setActiveTab("availability")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Clock className="w-4 h-4" />
          <span>Availability Schedule (FR-DOC-03)</span>
        </Button>

        <Button
          variant={activeTab === "affiliation" ? "primary" : "outline"}
          onPress={() => setActiveTab("affiliation")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Affiliations (FR-DOC-04/05)</span>
        </Button>

        <Button
          variant={activeTab === "agent" ? "primary" : "outline"}
          onPress={() => setActiveTab("agent")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Bot className="w-4 h-4" />
          <span>Specialty AI Trainer (FR-DOC-08)</span>
        </Button>

        <Button
          variant={activeTab === "appointments" ? "primary" : "outline"}
          onPress={() => setActiveTab("appointments")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments (FR-DOC-09)</span>
        </Button>

        <Button
          variant={activeTab === "directory" ? "primary" : "outline"}
          onPress={() => setActiveTab("directory")}
          className="text-xs font-semibold px-4 py-2 flex items-center gap-2 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>Scraped Listings (FR-DOC-07)</span>
        </Button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2">
              <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Credential Status</span>
              <div className="flex items-center gap-2 mt-1">
                {isVerified ? (
                  <span className="text-lg font-bold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-5 h-5" /> Verified Active
                  </span>
                ) : (
                  <span className="text-lg font-bold text-amber-400 flex items-center gap-1">
                    <Clock className="w-5 h-5" /> In Review Queue
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-secondary">FR-DOC-01 / FR-DOC-02 Licensing</span>
            </Card>

            <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2">
              <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Appointments</span>
              <span className="text-2xl font-bold text-text-primary mt-1">{appointments.length} Scheduled</span>
              <span className="text-[11px] text-text-secondary">FR-DOC-09 Booking Queue</span>
            </Card>

            <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2">
              <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Hospital Affiliation</span>
              <span className="text-base font-bold text-text-primary mt-1 truncate">
                {doctorData?.hospital?.name || "Standalone / Independent Clinic"}
              </span>
              <span className="text-[11px] text-text-secondary">FR-DOC-04 / FR-DOC-05 Bidirectional</span>
            </Card>

            <Card className="p-4 border border-border-custom bg-surface/50 flex flex-col gap-2">
              <span className="text-xs text-text-secondary uppercase font-mono font-semibold">Specialty AI Bot</span>
              <span className="text-base font-bold text-primary mt-1 flex items-center gap-1">
                <Bot className="w-4 h-4" />
                {doctorData?.aiTrainingData ? "Trained & Active" : "Untrained"}
              </span>
              <span className="text-[11px] text-text-secondary">FR-DOC-08 Emergency Question Set</span>
            </Card>
          </div>

          <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-4">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-border-custom pb-3">
              <UserCheck className="w-5 h-5 text-primary" />
              <span>Practitioner Profile Summary</span>
            </h2>

            {doctorData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-background-custom/50 border border-border-custom/60 flex flex-col gap-2">
                  <span className="font-bold text-text-primary">Name: Dr. {doctorData.user?.name}</span>
                  <span className="text-text-secondary">Email: {doctorData.user?.email}</span>
                  <span className="text-text-secondary">Specialty: {doctorData.specialty}</span>
                  <span className="text-text-secondary">Education: {doctorData.education}</span>
                  <span className="text-text-secondary">Experience: {doctorData.experience} Years</span>
                  <span className="text-text-secondary font-mono">License Number: {doctorData.licenseNumber}</span>
                </div>

                <div className="p-4 rounded-lg bg-background-custom/50 border border-border-custom/60 flex flex-col gap-2">
                  <span className="font-bold text-text-primary">Clinic Address & Practice:</span>
                  <span className="text-text-secondary">{doctorData.clinicAddress || "Primary Practice Address Not Set"}</span>
                  <span className="font-bold text-text-primary mt-2">Consultation Fee:</span>
                  <span className="text-text-secondary font-mono">${doctorData.consultationFee || 50} / Session</span>
                  <span className="font-bold text-text-primary mt-2">Affiliation Status:</span>
                  <Chip variant="soft" color="accent" className="w-fit text-[10px]">
                    {doctorData.affiliationStatus || "INDEPENDENT"}
                  </Chip>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-secondary">No practitioner profile submitted yet. Use the Credentials tab to register.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Profile & Credentials */}
      {activeTab === "profile" && (
        <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6">
          <div className="border-b border-border-custom pb-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span>Submit & Update Medical Credentials</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              FR-DOC-01: Submit qualifications and license details for administrator verification. FR-DOC-06: Independent clinic doctors maintain standalone profiles.
            </p>
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
      )}

      {/* Tab 3: Availability Schedule */}
      {activeTab === "availability" && (
        <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6">
          <div className="border-b border-border-custom pb-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Practitioner Availability Timetable</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              FR-DOC-03: Doctors directly control their own consultation availability, even when affiliated with a hospital (FR-DOC-04).
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-xs font-bold text-text-primary block mb-2">Select Working Days:</Label>
              <div className="flex flex-wrap gap-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                  const selected = workingDays.includes(day);
                  return (
                    <Button
                      key={day}
                      variant={selected ? "primary" : "secondary"}
                      size="sm"
                      className="text-xs"
                      onPress={() => toggleDay(day)}
                    >
                      {day}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Working Hours Start</Label>
                <Input
                  type="time"
                  value={workingHoursStart}
                  onChange={(e) => setWorkingHoursStart(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Working Hours End</Label>
                <Input
                  type="time"
                  value={workingHoursEnd}
                  onChange={(e) => setWorkingHoursEnd(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold text-text-primary">Slot Duration (Minutes)</Label>
                <Input
                  type="number"
                  value={String(slotDuration)}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-background-custom/40 border border-border-custom/60 flex flex-col gap-2">
              <span className="text-xs font-bold text-text-primary">Current Published Schedule Preview:</span>
              <div className="text-xs text-text-secondary flex flex-wrap gap-4">
                <span>
                  <strong>Days:</strong> {workingDays.join(", ") || "None selected"}
                </span>
                <span>
                  <strong>Hours:</strong> {workingHoursStart} - {workingHoursEnd}
                </span>
                <span>
                  <strong>Session Slot:</strong> {slotDuration} Minutes
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onPress={handleSaveAvailability} isDisabled={saving} className="px-6 font-semibold text-xs">
                {saving ? "Publishing..." : "Publish Availability Schedule"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Hospital Affiliation */}
      {activeTab === "affiliation" && (
        <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6">
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
      )}

      {/* Tab 5: Specialty AI Agent Trainer */}
      {activeTab === "agent" && (
        <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6">
          <div className="border-b border-border-custom pb-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span>Train Personal Specialty AI Agent</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              FR-DOC-08: Train your personal AI agent by completing the specialty emergency question set and scoping practice boundaries.
            </p>
          </div>

          <form onSubmit={handleTrainAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Agent Name</Label>
              <Input
                placeholder={`Dr. ${doctorData?.user?.name || "Practitioner"}'s Assistant`}
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Agent Tone</Label>
              <Input
                placeholder="e.g. Clinical, Empathetic, Reassuring"
                value={agentTone}
                onChange={(e) => setAgentTone(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Emergency Red Flags (Comma separated)</Label>
              <TextArea
                placeholder="Chest pain radiating to jaw/arm, sudden severe breathlessness..."
                value={emergencyRedFlags}
                onChange={(e) => setEmergencyRedFlags(e.target.value)}
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Specialty Intake & Triage Protocols</Label>
              <TextArea
                placeholder="Clinical guidelines on how the bot should triage patient symptoms for your specialty..."
                value={intakeProtocols}
                onChange={(e) => setIntakeProtocols(e.target.value)}
                rows={3}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Practice Scope & Prescription Disclaimers</Label>
              <TextArea
                placeholder="Rules on what advice the agent cannot provide..."
                value={practiceBoundaries}
                onChange={(e) => setPracticeBoundaries(e.target.value)}
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-text-primary">Custom Patient Medical Disclaimer</Label>
              <TextArea
                placeholder="Custom text displayed to patients before symptom triage..."
                value={customDisclaimer}
                onChange={(e) => setCustomDisclaimer(e.target.value)}
                rows={2}
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button variant="primary" type="submit" isDisabled={saving} className="px-6 font-semibold text-xs">
                {saving ? "Publishing Agent..." : "Train & Publish Specialty AI Agent"}
              </Button>
            </div>
          </form>

          {/* Interactive Agent Simulator Preview */}
          <div className="mt-4 p-5 rounded-xl bg-background-custom/40 border border-border-custom flex flex-col gap-3">
            <h3 className="text-xs font-bold text-text-primary uppercase font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Live AI Agent Simulator Preview
            </h3>

            <div className="flex gap-2">
              <Input
                placeholder="Type a sample patient symptom query (e.g. 'I have chest tightness')..."
                value={aiTestPrompt}
                onChange={(e) => setAiTestPrompt(e.target.value)}
                className="flex-1"
              />
              <Button variant="secondary" onPress={handleTestAgent} isDisabled={aiTesting} className="text-xs">
                <Send className="w-3.5 h-3.5 mr-1" /> {aiTesting ? "Testing..." : "Test Response"}
              </Button>
            </div>

            {aiTestResult && (
              <div className="p-3 rounded-lg bg-surface/80 border border-primary/40 text-xs text-text-primary font-mono">
                {aiTestResult}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Tab 6: Appointment Center */}
      {activeTab === "appointments" && (
        <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6">
          <div className="border-b border-border-custom pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Patient Appointments Manager</span>
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                FR-DOC-09: View, accept, reschedule, cancel, and mark complete patient appointments against your schedule.
              </p>
            </div>

            <Button variant="secondary" size="sm" className="text-xs" onPress={fetchAppointments}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Bookings
            </Button>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border-custom rounded-xl text-text-secondary text-xs">
              No active patient appointments booked yet.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl bg-surface/60 border border-border-custom flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text-primary text-sm">
                        Patient: {apt.patient?.name || "Patient"}
                      </span>
                      <Chip
                        variant="soft"
                        color={
                          apt.status === "CONFIRMED"
                            ? "success"
                            : apt.status === "COMPLETED"
                            ? "accent"
                            : apt.status === "CANCELLED"
                            ? "danger"
                            : "warning"
                        }
                        className="text-[10px] uppercase font-mono"
                      >
                        {apt.status}
                      </Chip>
                    </div>
                    <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(apt.dateTime).toLocaleString()}
                    </span>
                    {apt.notes && (
                      <p className="text-xs text-text-secondary italic mt-1 font-serif">"{apt.notes}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {apt.status === "PENDING" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-semibold"
                        onPress={() => handleUpdateAppointment(apt.id, "CONFIRMED")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accept Slot
                      </Button>
                    )}

                    {apt.status === "CONFIRMED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs font-semibold text-emerald-400"
                        onPress={() => handleUpdateAppointment(apt.id, "COMPLETED")}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark Complete
                      </Button>
                    )}

                    {apt.status !== "CANCELLED" && apt.status !== "COMPLETED" && (
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs font-semibold"
                        onPress={() => handleUpdateAppointment(apt.id, "CANCELLED")}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 7: Public Directory & Scraped Preview */}
      {activeTab === "directory" && (
        <Card className="p-6 border border-border-custom bg-surface/40 flex flex-col gap-6">
          <div className="border-b border-border-custom pb-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              <span>Doctor Directory & Fallback Scraped Listings</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              FR-DOC-07: Unregistered doctors appear as scraped listings. Verified registered doctors are badged and ranked above unverified scraped directory entries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scrapedDirectory.map((doc) => (
              <Card
                key={doc.id}
                className={`p-4 border ${
                  doc.isVerified
                    ? "border-emerald-500/40 bg-emerald-950/10"
                    : doc.isScraped
                    ? "border-border-custom bg-surface/30"
                    : "border-amber-500/30 bg-amber-950/10"
                } flex flex-col gap-2`}
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
                    <MapPin className="w-3 h-3 text-text-secondary" /> {doc.clinicAddress}
                  </span>
                )}
                {doc.consultationFee > 0 && (
                  <span className="text-xs font-mono text-emerald-400">
                    Fee: ${doc.consultationFee} / session
                  </span>
                )}
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
