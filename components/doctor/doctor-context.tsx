"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface DoctorContextType {
  loading: boolean;
  saving: boolean;
  doctorData: any;
  appointments: any[];
  scrapedDirectory: any[];
  toastMessage: { text: string; type: "success" | "error" } | null;
  showToast: (text: string, type?: "success" | "error") => void;

  // Verification & Submission Status
  isProfileSubmitted: boolean;
  isVerified: boolean;
  isRejected: boolean;
  verificationStatus: string;
  rejectionReason: string | null;
  canAccessDependentTabs: boolean;

  // Enriched Authenticity & Profile Form States
  specialty: string;
  setSpecialty: (val: string) => void;
  subSpecialty: string;
  setSubSpecialty: (val: string) => void;
  education: string;
  setEducation: (val: string) => void;
  experience: number;
  setExperience: (val: number) => void;
  licenseNumber: string;
  setLicenseNumber: (val: string) => void;
  issuingBoard: string;
  setIssuingBoard: (val: string) => void;
  nationalIdNumber: string;
  setNationalIdNumber: (val: string) => void;
  documentUrl: string;
  setDocumentUrl: (val: string) => void;
  reviewNotes: string;
  setReviewNotes: (val: string) => void;

  bio: string;
  setBio: (val: string) => void;
  clinicAddress: string;
  setClinicAddress: (val: string) => void;
  consultationFee: number;
  setConsultationFee: (val: number) => void;
  selectedHospitalId: string;
  setSelectedHospitalId: (val: string) => void;
  handleSaveProfile: (e: React.FormEvent) => Promise<void>;

  // History & Review Request
  applicationHistories: any[];
  fetchApplicationHistory: () => Promise<void>;

  // Availability States
  workingDays: string[];
  setWorkingDays: (days: string[]) => void;
  workingHoursStart: string;
  setWorkingHoursStart: (val: string) => void;
  workingHoursEnd: string;
  setWorkingHoursEnd: (val: string) => void;
  slotDuration: number;
  setSlotDuration: (val: number) => void;
  toggleDay: (day: string) => void;
  handleSaveAvailability: () => Promise<void>;

  // AI Training States
  agentName: string;
  setAgentName: (val: string) => void;
  agentTone: string;
  setAgentTone: (val: string) => void;
  emergencyRedFlags: string;
  setEmergencyRedFlags: (val: string) => void;
  intakeProtocols: string;
  setIntakeProtocols: (val: string) => void;
  practiceBoundaries: string;
  setPracticeBoundaries: (val: string) => void;
  customDisclaimer: string;
  setCustomDisclaimer: (val: string) => void;
  aiTestPrompt: string;
  setAiTestPrompt: (val: string) => void;
  aiTestResult: string | null;
  setAiTestResult: (val: string | null) => void;
  aiTesting: boolean;
  handleTrainAgent: (e: React.FormEvent) => Promise<void>;
  handleTestAgent: () => Promise<void>;

  // Actions
  handleUpdateAppointment: (appointmentId: string, newStatus: string) => Promise<void>;
  handleAffiliationAction: (action: string, targetHospitalId?: string) => Promise<void>;
  fetchDoctorProfile: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchDirectory: () => Promise<void>;
}

const DoctorContext = createContext<DoctorContextType | undefined>(undefined);

export function DoctorProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [scrapedDirectory, setScrapedDirectory] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Enriched Form & Authenticity states
  const [specialty, setSpecialty] = useState("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState(5);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [issuingBoard, setIssuingBoard] = useState("");
  const [nationalIdNumber, setNationalIdNumber] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const [bio, setBio] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [consultationFee, setConsultationFee] = useState(50);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [applicationHistories, setApplicationHistories] = useState<any[]>([]);

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
        setSubSpecialty(doc.subSpecialty || "");
        setEducation(doc.education || "");
        setExperience(doc.experience || 0);
        setLicenseNumber(doc.licenseNumber || "");
        setIssuingBoard(doc.issuingBoard || "");
        setNationalIdNumber(doc.nationalIdNumber || "");
        setDocumentUrl(doc.documentUrl || "");
        setReviewNotes(doc.reviewNotes || "");
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

  const fetchApplicationHistory = async () => {
    try {
      const res = await fetch("/api/doctors/history");
      const data = await res.json();
      if (data.histories) {
        setApplicationHistories(data.histories);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointments();
    fetchDirectory();
    fetchApplicationHistory();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialty,
          subSpecialty,
          education,
          experience: Number(experience),
          licenseNumber,
          issuingBoard,
          nationalIdNumber,
          documentUrl,
          reviewNotes,
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
      fetchApplicationHistory();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

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

  const isProfileSubmitted = Boolean(
    doctorData && doctorData.specialty && doctorData.licenseNumber && doctorData.education
  );
  const verificationStatus = doctorData?.verificationStatus || (doctorData?.isVerified ? "APPROVED" : isProfileSubmitted ? "PENDING" : "UNSUBMITTED");
  const isRejected = verificationStatus === "REJECTED";
  const isVerified = Boolean(doctorData?.isVerified) || verificationStatus === "APPROVED";
  const rejectionReason = doctorData?.rejectionReason || null;
  const canAccessDependentTabs = isVerified;

  return (
    <DoctorContext.Provider
      value={{
        loading,
        saving,
        doctorData,
        appointments,
        scrapedDirectory,
        toastMessage,
        showToast,
        isProfileSubmitted,
        isVerified,
        isRejected,
        verificationStatus,
        rejectionReason,
        canAccessDependentTabs,
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
        bio,
        setBio,
        clinicAddress,
        setClinicAddress,
        consultationFee,
        setConsultationFee,
        selectedHospitalId,
        setSelectedHospitalId,
        handleSaveProfile,
        applicationHistories,
        fetchApplicationHistory,
        workingDays,
        setWorkingDays,
        workingHoursStart,
        setWorkingHoursStart,
        workingHoursEnd,
        setWorkingHoursEnd,
        slotDuration,
        setSlotDuration,
        toggleDay,
        handleSaveAvailability,
        agentName,
        setAgentName,
        agentTone,
        setAgentTone,
        emergencyRedFlags,
        setEmergencyRedFlags,
        intakeProtocols,
        setIntakeProtocols,
        practiceBoundaries,
        setPracticeBoundaries,
        customDisclaimer,
        setCustomDisclaimer,
        aiTestPrompt,
        setAiTestPrompt,
        aiTestResult,
        setAiTestResult,
        aiTesting,
        handleTrainAgent,
        handleTestAgent,
        handleUpdateAppointment,
        handleAffiliationAction,
        fetchDoctorProfile,
        fetchAppointments,
        fetchDirectory,
      }}
    >
      {children}
    </DoctorContext.Provider>
  );
}

export function useDoctorContext() {
  const context = useContext(DoctorContext);
  if (!context) {
    throw new Error("useDoctorContext must be used within a DoctorProvider");
  }
  return context;
}
