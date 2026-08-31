"use client";

import {
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Tabs,
  TextArea,
  Tooltip,
} from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarCheck,
  Clock,
  Compass,
  FlaskConical,
  GraduationCap,
  MapPin,
  Navigation,
  Pill,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import type { DirectoryEntity } from "@/app/api/directory/route";
import { TableToolbar, TableFooter } from "@/components/ui/table-toolbar";
import { cn } from "@/lib/utils";

const SPECIALTY_OPTIONS = [
  "All Specialties",
  "General Physician",
  "Dermatology",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "ENT",
  "Ophthalmology",
  "Psychiatry",
  "Gastroenterology",
  "Pulmonology",
];

const ENTITY_ICONS: Record<string, LucideIcon> = {
  DOCTOR: Stethoscope,
  HOSPITAL: Building2,
  PHARMACY: Pill,
  LAB: FlaskConical,
};

export function PatientDirectory() {
  const [providers, setProviders] = useState<DirectoryEntity[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    doctors: 0,
    hospitals: 0,
    pharmacies: 0,
    labs: 0,
    verifiedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("All Specialties");
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(10);
  const [locationName, setLocationName] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(12);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState<DirectoryEntity | null>(null);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("10:00");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("type", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (specialtyFilter !== "All Specialties") params.set("specialty", specialtyFilter);
      if (verifiedOnly) params.set("verifiedOnly", "true");

      const res = await fetch(`/api/directory?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.providers) {
        setProviders(data.providers);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to fetch directory providers:", err);
      toast.error("Failed to load healthcare directory.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, specialtyFilter, verifiedOnly]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const requestDeviceLocation = async () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationName("Location unavailable");
      return;
    }

    setIsLocating(true);
    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocationName(`GPS: ${coords.lat.toFixed(2)}°, ${coords.lng.toFixed(2)}°`);
            toast.success("Device GPS location detected.");
            resolve();
          },
          (err) => {
            console.warn("Geolocation error:", err.message);
            setLocationName("Location Access Denied");
            toast.error("Location permission denied.");
            resolve();
          },
          { timeout: 8000, enableHighAccuracy: true },
        );
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!bookingDoctor || !bookingDate || !bookingTime) {
      toast.error("Please select a date and time for the appointment.");
      return;
    }

    setIsBooking(true);
    try {
      const dateTimeStr = `${bookingDate}T${bookingTime}:00`;
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: bookingDoctor.id,
          dateTime: new Date(dateTimeStr).toISOString(),
          notes: bookingNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reserve appointment slot.");
      }

      toast.success(`Appointment request submitted with Dr. ${bookingDoctor.name}!`);
      setBookingDoctor(null);
      setBookingNotes("");
      setBookingDate("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking request.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-6 overflow-y-auto bg-background-custom p-4 sm:p-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              Healthcare Directory & Provider Discovery
            </h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            Find and connect with verified doctors, hospital centers, licensed pharmacies, and diagnostic labs.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant={locationName ? "primary" : "secondary"}
            className="text-xs font-semibold"
            onPress={requestDeviceLocation}
          >
            <Navigation className={cn("h-3.5 w-3.5", isLocating && "animate-spin")} />
            {isLocating ? "Locating..." : locationName || "Use Device GPS"}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="text-xs font-semibold"
            onPress={fetchProviders}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-custom pb-1">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(String(key))}
          className="w-full"
        >
          <Tabs.List className="gap-2 bg-transparent p-0">
            <Tabs.Tab id="ALL" className="text-xs font-semibold">
              All Providers ({counts.all})
            </Tabs.Tab>
            <Tabs.Tab id="DOCTOR" className="text-xs font-semibold">
              Doctors ({counts.doctors})
            </Tabs.Tab>
            <Tabs.Tab id="HOSPITAL" className="text-xs font-semibold">
              Hospitals ({counts.hospitals})
            </Tabs.Tab>
            <Tabs.Tab id="PHARMACY" className="text-xs font-semibold">
              Pharmacies ({counts.pharmacies})
            </Tabs.Tab>
            <Tabs.Tab id="LAB" className="text-xs font-semibold">
              Labs ({counts.labs})
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </div>

      {/* Filters Toolbar */}
      <TableToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search provider by name, specialty, address, or facilities..."
        onRefresh={fetchProviders}
        isRefreshing={loading}
        hasActiveFilters={Boolean(searchQuery || specialtyFilter !== "All Specialties" || verifiedOnly)}
        onClearFilters={() => {
          setSearchQuery("");
          setSpecialtyFilter("All Specialties");
          setVerifiedOnly(false);
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Specialty Dropdown (when All or Doctor tab active) */}
          {(activeTab === "ALL" || activeTab === "DOCTOR") && (
            <Select
              aria-label="Filter by Medical Specialty"
              className="w-44 sm:w-48"
              selectedKey={specialtyFilter}
              onSelectionChange={(key) => {
                if (key) setSpecialtyFilter(String(key));
              }}
            >
              <Select.Trigger className="h-8 text-xs font-medium">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="min-w-48">
                <ListBox>
                  {SPECIALTY_OPTIONS.map((spec) => (
                    <ListBox.Item key={spec} id={spec} textValue={spec}>
                      <Label className="text-xs">{spec}</Label>
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          )}

          {/* Verified Only Toggle */}
          <Button
            size="sm"
            variant={verifiedOnly ? "primary" : "secondary"}
            className="h-8 text-xs font-semibold"
            onPress={() => setVerifiedOnly(!verifiedOnly)}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Verified Only
          </Button>

          {/* Search Radius Dropdown */}
          <Select
            aria-label="Search Radius"
            className="w-32"
            selectedKey={String(searchRadiusKm)}
            onSelectionChange={(key) => {
              if (key) setSearchRadiusKm(Number(key));
            }}
          >
            <Select.Trigger className="h-8 text-xs font-medium">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="min-w-32">
              <ListBox>
                {[5, 10, 25, 50, 100].map((km) => (
                  <ListBox.Item key={km} id={String(km)} textValue={`${km} km Radius`}>
                    <Label className="text-xs">{km} km</Label>
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </TableToolbar>

      {/* Bento Provider Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-border-custom bg-surface/40"
            />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border border-border-custom bg-surface/30 p-12 text-center">
          <div className="rounded-2xl border border-border-custom bg-surface/80 p-4 text-text-secondary">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">No providers found</h3>
          <p className="max-w-sm text-xs text-text-secondary">
            No healthcare entities matched your current search parameters or radius filters. Try expanding the radius or clearing filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.slice(0, pageSize).map((provider) => {
            const Icon = ENTITY_ICONS[provider.entityType] || Stethoscope;
            const isDoctor = provider.entityType === "DOCTOR";

            return (
              <Card
                key={provider.id}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-surface/70 p-5 shadow-xs transition-all hover:border-primary/40 hover:shadow-md",
                  provider.isVerified
                    ? "border-border-custom"
                    : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40"
                )}
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {provider.isVerified ? (
                        <Chip
                          size="sm"
                          variant="soft"
                          className="border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-500"
                        >
                          <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                        </Chip>
                      ) : (
                        <Tooltip delay={100}>
                          <Tooltip.Trigger>
                            <Chip
                              size="sm"
                              variant="soft"
                              className="border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-500"
                            >
                              <ShieldAlert className="mr-1 h-3 w-3" /> Unverified / Public
                            </Chip>
                          </Tooltip.Trigger>
                          <Tooltip.Content className="max-w-xs px-2 py-1 text-xs" placement="top">
                            This record was aggregated from public medical listings and has not completed Medicio credential verification.
                          </Tooltip.Content>
                        </Tooltip>
                      )}

                      <Chip
                        size="sm"
                        variant="soft"
                        className="text-[10px] font-mono font-bold uppercase text-text-secondary"
                      >
                        {provider.entityType}
                      </Chip>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mt-3.5">
                    <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                      {isDoctor ? `Dr. ${provider.name}` : provider.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-primary line-clamp-1">
                      {provider.subTitle || "Clinical Provider"}
                    </p>
                  </div>

                  {/* Location & Details */}
                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                      <span className="truncate">{provider.location}</span>
                    </div>

                    {provider.experience !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                        <span>{provider.experience} years clinical experience</span>
                      </div>
                    )}

                    {provider.education && (
                      <div className="flex items-center gap-1.5 line-clamp-1">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                        <span className="truncate">{provider.education}</span>
                      </div>
                    )}

                    {provider.facilities && provider.facilities.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {provider.facilities.slice(0, 3).map((f, i) => (
                          <span
                            key={i}
                            className="rounded-md border border-border-custom bg-surface px-1.5 py-0.5 text-[10px] text-text-secondary"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 flex items-center justify-between border-t border-border-custom pt-3">
                  {provider.consultationFee !== undefined ? (
                    <div>
                      <span className="text-[10px] text-text-secondary">Consultation Fee</span>
                      <p className="text-sm font-bold text-text-primary">
                        ${provider.consultationFee}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary">
                      {provider.contactInfo || "Direct Portal Listing"}
                    </span>
                  )}

                  {isDoctor && provider.isVerified ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="text-xs font-semibold"
                      onPress={() => {
                        setBookingDoctor(provider);
                        setBookingDate(new Date().toISOString().split("T")[0]);
                      }}
                    >
                      <CalendarCheck className="mr-1 h-3.5 w-3.5" /> Book Slot
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs font-semibold"
                      onPress={() => {
                        if (provider.contactInfo) {
                          toast.info(`Contact: ${provider.contactInfo}`);
                        } else {
                          toast.info(`Location: ${provider.location}`);
                        }
                      }}
                    >
                      View Info
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <TableFooter
        showingCount={Math.min(providers.length, pageSize)}
        totalCount={providers.length}
        entityLabel="providers"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Direct Booking Modal */}
      {bookingDoctor && (
        <Modal.Root isOpen={!!bookingDoctor} onOpenChange={() => setBookingDoctor(null)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Book Appointment with Dr. {bookingDoctor.name}
                    </h3>
                    <p className="text-[11px] text-text-secondary">
                      {bookingDoctor.subTitle} • ${bookingDoctor.consultationFee}
                    </p>
                  </div>
                </div>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3 py-2 text-xs text-text-primary">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <Label className="font-semibold text-text-secondary">Preferred Date *</Label>
                    <Input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="font-semibold text-text-secondary">Time Slot *</Label>
                    <Input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Label className="font-semibold text-text-secondary">Reason / Symptoms (Optional)</Label>
                  <TextArea
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-[11px] text-text-secondary">
                  <span className="font-bold text-text-primary">Clinical Location:</span>{" "}
                  {bookingDoctor.location}
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 border-t border-border-custom pt-4">
                <Button size="sm" variant="secondary" onPress={() => setBookingDoctor(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  isDisabled={isBooking || !bookingDate}
                  onPress={handleBookAppointment}
                >
                  {isBooking ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    "Confirm Booking"
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
