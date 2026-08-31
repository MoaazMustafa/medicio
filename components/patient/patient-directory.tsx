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
  AlertCircle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  Crosshair,
  FlaskConical,
  Globe2,
  GraduationCap,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  Navigation,
  Pill,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { DirectoryEntity } from "@/app/api/directory/route";
import { ProviderMap } from "@/components/patient/provider-map";
import { TableToolbar, TableFooter } from "@/components/ui/table-toolbar";
import {
  getExactUserLocation,
  getIpGeolocation,
  forwardGeocodePlace,
  DEFAULT_PAKISTAN_LOCATION,
} from "@/lib/geo-location";
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
  "Gastroenterology",
  "ENT",
  "Ophthalmology",
  "Psychiatry",
  "Pulmonology",
];

// Major Pakistani Medical Centers & Hubs
const PAKISTAN_PRESET_LOCATIONS = [
  { name: "Lahore (Gulberg / Johar Town / DHA)", lat: 31.5204, lng: 74.3587 },
  { name: "Islamabad (Blue Area / H-8 / PIMS)", lat: 33.6844, lng: 73.0641 },
  { name: "Karachi (AKUH / Clifton / Bahadurabad)", lat: 24.8934, lng: 67.0734 },
  { name: "Rawalpindi (Saddar / Holy Family)", lat: 33.5989, lng: 73.0531 },
  { name: "Faisalabad (Civil Lines / Medical City)", lat: 31.4187, lng: 73.0791 },
  { name: "Peshawar (Hayatabad Medical Complex)", lat: 33.9961, lng: 71.4724 },
  { name: "Multan (Nishtar Medical Area)", lat: 30.1984, lng: 71.4687 },
];

const ENTITY_ICONS: Record<string, LucideIcon> = {
  DOCTOR: Stethoscope,
  HOSPITAL: Building2,
  PHARMACY: Pill,
  LAB: FlaskConical,
};

export function PatientDirectory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial query-based values from URL
  const initialType = (searchParams.get("type") || "ALL").toUpperCase();
  const initialSearch = searchParams.get("search") || "";
  const initialSpecialty = searchParams.get("specialty") || "All Specialties";
  const initialVerified = searchParams.get("verifiedOnly") === "true";
  const initialRadius = searchParams.has("radius") ? Number(searchParams.get("radius")) : 25;
  const initialLat = searchParams.has("lat") ? Number(searchParams.get("lat")) : DEFAULT_PAKISTAN_LOCATION.lat;
  const initialLng = searchParams.has("lng") ? Number(searchParams.get("lng")) : DEFAULT_PAKISTAN_LOCATION.lng;
  const initialLocation = searchParams.get("location") || DEFAULT_PAKISTAN_LOCATION.displayName;
  const initialView = (searchParams.get("view") || "MAP").toUpperCase() === "GRID" ? "GRID" : "MAP";

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

  // View state: Grid vs Interactive Map & List
  const [viewMode, setViewMode] = useState<"GRID" | "MAP">(initialView as "GRID" | "MAP");
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(initialSpecialty);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(initialVerified);
  const [searchRadiusKm, setSearchRadiusKm] = useState<number>(initialRadius);

  // User Location State
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [locationName, setLocationName] = useState<string>(initialLocation);
  const [customLocationInput, setCustomLocationInput] = useState<string>("");
  const [locationError, setLocationError] = useState<string>("");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(12);

  // Booking Modal State
  const [bookingDoctor, setBookingDoctor] = useState<DirectoryEntity | null>(null);
  const [bookingDate, setBookingDate] = useState<string>("");
  const [bookingTime, setBookingTime] = useState<string>("10:00");
  const [bookingNotes, setBookingNotes] = useState<string>("");
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Sync state changes into URL query parameters
  const updateUrlQueryParams = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === "ALL" || value === "All Specialties" || value === false) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // 1. Initial Device GPS Detection (Built From Scratch)
  useEffect(() => {
    // If coordinates were already given in URL, preserve them
    if (searchParams.has("lat") && searchParams.has("lng")) {
      return;
    }

    const initLocation = async () => {
      setIsLocating(true);
      try {
        const result = await getExactUserLocation();
        setUserCoordinates({ lat: result.lat, lng: result.lng });
        setLocationName(result.displayName);
        if (result.accuracyMeters) setLocationAccuracy(result.accuracyMeters);

        updateUrlQueryParams({
          lat: result.lat,
          lng: result.lng,
          location: result.displayName,
        });
      } finally {
        setIsLocating(false);
      }
    };

    initLocation();
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("type", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (specialtyFilter !== "All Specialties") params.set("specialty", specialtyFilter);
      if (verifiedOnly) params.set("verifiedOnly", "true");

      // Pass coordinates & radius to backend
      params.set("lat", String(userCoordinates.lat));
      params.set("lng", String(userCoordinates.lng));
      params.set("radius", String(searchRadiusKm));

      const res = await fetch(`/api/directory?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.providers) {
        setProviders(data.providers);
        if (data.counts) setCounts(data.counts);
      }
    } catch {
      toast.error("Failed to load healthcare directory.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, specialtyFilter, verifiedOnly, userCoordinates, searchRadiusKm]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Request auto location detection (Hardware GPS with automatic Network/IP fallback)
  const handleDetectExactLocation = async () => {
    setIsLocating(true);
    setLocationError("");
    try {
      const result = await getExactUserLocation();
      setUserCoordinates({ lat: result.lat, lng: result.lng });
      setLocationName(result.displayName);
      if (result.accuracyMeters) {
        setLocationAccuracy(result.accuracyMeters);
      }
      toast.success(`Location detected: ${result.displayName}`);

      updateUrlQueryParams({
        lat: result.lat,
        lng: result.lng,
        location: result.displayName,
      });
      setIsLocationModalOpen(false);
    } catch {
      toast.info("Using default Pakistan medical center.");
      setIsLocationModalOpen(false);
    } finally {
      setIsLocating(false);
    }
  };

  // Auto-detect via Network/IP (No browser GPS permissions required)
  const handleDetectNetworkLocation = async () => {
    setIsLocating(true);
    setLocationError("");
    try {
      const result = await getIpGeolocation();
      setUserCoordinates({ lat: result.lat, lng: result.lng });
      setLocationName(result.displayName);
      setLocationAccuracy(null);
      toast.success(`Network location detected: ${result.displayName}`);

      updateUrlQueryParams({
        lat: result.lat,
        lng: result.lng,
        location: result.displayName,
      });
      setIsLocationModalOpen(false);
    } catch {
      toast.error("Could not determine network location.");
    } finally {
      setIsLocating(false);
    }
  };

  // OpenStreetMap Nominatim Geocoding for manual location inputs
  const handleApplyCustomLocation = async () => {
    const query = customLocationInput.trim();
    if (!query) return;

    setIsGeocoding(true);
    setLocationError("");
    try {
      const result = await forwardGeocodePlace(query);
      if (result) {
        setUserCoordinates({ lat: result.lat, lng: result.lng });
        setLocationName(result.displayName);
        setLocationAccuracy(null);

        updateUrlQueryParams({
          lat: result.lat,
          lng: result.lng,
          location: result.displayName,
        });

        setIsLocationModalOpen(false);
        setCustomLocationInput("");
        toast.success(`Location set to ${result.displayName}`);
      } else {
        setLocationError("Location not found. Please enter a valid city or area in Pakistan.");
        toast.error("Location not found. Please check spelling.");
      }
    } catch {
      setLocationError("Geocoding service unavailable. Please try again.");
      toast.error("Network error validating location.");
    } finally {
      setIsGeocoding(false);
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
    <div className="flex h-full w-full flex-col gap-5 overflow-y-auto bg-background-custom p-4 sm:p-7">
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
            Locate verified doctors, hospitals, pharmacies, and diagnostic laboratories across Pakistan.
          </p>
        </div>

        {/* Top Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Location Trigger */}
          <Button
            size="sm"
            variant="secondary"
            className="text-xs font-semibold h-8 rounded-xl border border-border-custom"
            onPress={() => {
              setLocationError("");
              setIsLocationModalOpen(true);
            }}
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="max-w-36 truncate">{locationName}</span>
            {locationAccuracy && (
              <Chip size="sm" variant="soft" className="text-[9px] font-mono text-emerald-500">
                ±{locationAccuracy}m
              </Chip>
            )}
            <Chip size="sm" variant="soft" className="ml-1 text-[9px] font-mono">
              {searchRadiusKm}km
            </Chip>
          </Button>

          {/* View Mode Toggle: Grid vs Map */}
          <div className="flex items-center rounded-xl border border-border-custom bg-surface p-0.5">
            <Button
              size="sm"
              variant={viewMode === "MAP" ? "primary" : "ghost"}
              className={cn("h-7 px-2.5 text-xs font-semibold rounded-lg", viewMode !== "MAP" && "text-text-secondary")}
              onPress={() => {
                setViewMode("MAP");
                updateUrlQueryParams({ view: "MAP" });
              }}
            >
              <MapIcon className="mr-1 h-3.5 w-3.5" /> Map View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "GRID" ? "primary" : "ghost"}
              className={cn("h-7 px-2.5 text-xs font-semibold rounded-lg", viewMode !== "GRID" && "text-text-secondary")}
              onPress={() => {
                setViewMode("GRID");
                updateUrlQueryParams({ view: "GRID" });
              }}
            >
              <LayoutGrid className="mr-1 h-3.5 w-3.5" /> Grid View
            </Button>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="text-xs font-semibold h-8 rounded-xl"
            onPress={fetchProviders}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border-custom pb-1">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            const newTab = String(key);
            setActiveTab(newTab);
            updateUrlQueryParams({ type: newTab });
          }}
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
        onSearchChange={(val) => {
          setSearchQuery(val);
          updateUrlQueryParams({ search: val });
        }}
        searchPlaceholder="Search by doctor name, specialty, address, hospital, or city in Pakistan..."
        onRefresh={fetchProviders}
        isRefreshing={loading}
        hasActiveFilters={Boolean(searchQuery || specialtyFilter !== "All Specialties" || verifiedOnly)}
        onClearFilters={() => {
          setSearchQuery("");
          setSpecialtyFilter("All Specialties");
          setVerifiedOnly(false);
          updateUrlQueryParams({ search: "", specialty: "", verifiedOnly: false });
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {(activeTab === "ALL" || activeTab === "DOCTOR") && (
            <Select
              aria-label="Filter by Medical Specialty"
              className="w-44 sm:w-48"
              selectedKey={specialtyFilter}
              onSelectionChange={(key) => {
                const spec = key ? String(key) : "All Specialties";
                setSpecialtyFilter(spec);
                updateUrlQueryParams({ specialty: spec });
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

          <Button
            size="sm"
            variant={verifiedOnly ? "primary" : "secondary"}
            className="h-8 text-xs font-semibold rounded-xl"
            onPress={() => {
              const newVerified = !verifiedOnly;
              setVerifiedOnly(newVerified);
              updateUrlQueryParams({ verifiedOnly: newVerified });
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Verified Only
          </Button>

          <Select
            aria-label="Search Radius"
            className="w-32"
            selectedKey={String(searchRadiusKm)}
            onSelectionChange={(key) => {
              if (key) {
                const rad = Number(key);
                setSearchRadiusKm(rad);
                updateUrlQueryParams({ radius: rad });
              }
            }}
          >
            <Select.Trigger className="h-8 text-xs font-medium">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover className="min-w-32">
              <ListBox>
                {[5, 10, 25, 50, 100, 250].map((km) => (
                  <ListBox.Item key={km} id={String(km)} textValue={`${km} km Radius`}>
                    <Label className="text-xs">{km} km Radius</Label>
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </TableToolbar>

      {/* Main Content: Split Map/List vs Grid */}
      {viewMode === "MAP" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 min-h-[560px]">
          {/* Left Column: Interactive OpenStreetMap Tile Map (7 cols) */}
          <div className="lg:col-span-7 h-[440px] lg:h-full min-h-[440px] sticky top-0">
            <ProviderMap
              providers={providers}
              selectedProviderId={selectedProviderId}
              onSelectProvider={(p) => {
                setSelectedProviderId(p.id);
              }}
              onBookDoctor={(doc) => {
                setBookingDoctor(doc);
                setBookingDate(new Date().toISOString().split("T")[0]);
              }}
              userCoordinates={userCoordinates}
              locationName={locationName}
              searchRadiusKm={searchRadiusKm}
              onUpdateLocationCoordinates={(coords, name) => {
                setUserCoordinates(coords);
                if (name) setLocationName(name);
                setLocationAccuracy(null);
                updateUrlQueryParams({ lat: coords.lat, lng: coords.lng, location: name });
              }}
              onExpandRadius={(newRadius) => {
                setSearchRadiusKm(newRadius);
                updateUrlQueryParams({ radius: newRadius });
              }}
              onDetectLocation={handleDetectExactLocation}
              isLocating={isLocating}
            />
          </div>

          {/* Right Column: Synchronized Provider List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-2xl border border-border-custom bg-surface/40" />
                ))}
              </div>
            ) : providers.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center border border-border-custom bg-surface/60 rounded-2xl shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Compass className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Nothing found in your area
                  </h3>
                  <p className="mt-1 text-xs text-text-secondary">
                    No healthcare facilities or doctors match within {searchRadiusKm} km of {locationName}.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs font-semibold mt-1"
                  onPress={() => {
                    const nextRad = searchRadiusKm < 50 ? 50 : searchRadiusKm < 100 ? 100 : 250;
                    setSearchRadiusKm(nextRad);
                    updateUrlQueryParams({ radius: nextRad });
                  }}
                >
                  Expand Search Radius ({searchRadiusKm < 50 ? "50 km" : searchRadiusKm < 100 ? "100 km" : "250 km"})
                </Button>
              </Card>
            ) : (
              providers.map((provider) => {
                const Icon = ENTITY_ICONS[provider.entityType] || Stethoscope;
                const isSelected = selectedProviderId === provider.id;
                const isDoctor = provider.entityType === "DOCTOR";

                return (
                  <Card
                    key={provider.id}
                    className={cn(
                      "flex flex-col gap-2.5 rounded-2xl border p-4 transition-all cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/40"
                        : "border-border-custom bg-surface/70 hover:border-primary/40"
                    )}
                    onClick={() => setSelectedProviderId(provider.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-text-primary line-clamp-1">
                            {isDoctor ? `Dr. ${provider.name}` : provider.name}
                          </h3>
                          <p className="text-[11px] font-medium text-primary line-clamp-1">
                            {provider.subTitle || "Clinical Provider"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Chip
                          size="sm"
                          variant="soft"
                          className={cn(
                            "text-[9px] font-bold",
                            provider.isVerified
                              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                              : "border border-amber-500/30 bg-amber-500/10 text-amber-500"
                          )}
                        >
                          {provider.isVerified ? "Verified" : "Unverified"}
                        </Chip>
                        {provider.distanceKm !== undefined && (
                          <Chip size="sm" variant="soft" className="text-[9px] font-mono">
                            {provider.distanceKm} km
                          </Chip>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-secondary border-t border-border-custom/80 pt-2">
                      <span className="truncate max-w-[220px]">{provider.location}</span>
                      {provider.consultationFee !== undefined && (
                        <span className="font-bold text-text-primary shrink-0">{provider.consultationFee} PKR</span>
                      )}
                    </div>

                    {isDoctor && provider.isVerified && (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs font-semibold h-7 mt-1"
                        onPress={() => {
                          setBookingDoctor(provider);
                          setBookingDate(new Date().toISOString().split("T")[0]);
                        }}
                      >
                        <CalendarCheck className="mr-1 h-3.5 w-3.5" /> Book Consultation
                      </Button>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Grid Bento View */
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
                        <Chip
                          size="sm"
                          variant="soft"
                          className="border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-500"
                        >
                          <ShieldAlert className="mr-1 h-3 w-3" /> Public
                        </Chip>
                      )}

                      <Chip
                        size="sm"
                        variant="soft"
                        className="text-[10px] font-mono font-bold uppercase text-text-secondary"
                      >
                        {provider.entityType}
                      </Chip>

                      {provider.distanceKm !== undefined && (
                        <Chip size="sm" variant="soft" className="text-[10px] font-mono">
                          {provider.distanceKm} km
                        </Chip>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                      {isDoctor ? `Dr. ${provider.name}` : provider.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-medium text-primary line-clamp-1">
                      {provider.subTitle || "Clinical Provider"}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-col gap-1.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                      <span className="truncate">{provider.location}</span>
                    </div>

                    {provider.experience !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                        <span>{provider.experience} years experience</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border-custom pt-3">
                  {provider.consultationFee !== undefined ? (
                    <div>
                      <span className="text-[10px] text-text-secondary">Consultation</span>
                      <p className="text-sm font-bold text-text-primary">
                        {provider.consultationFee} PKR
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-text-secondary">
                      {provider.contactInfo || "Direct Listing"}
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
                        toast.info(provider.contactInfo || provider.location);
                      }}
                    >
                      View Details
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
        entityLabel="providers in area"
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {/* Set Location Dialog Modal with OpenStreetMap Geocoding Validation */}
      {isLocationModalOpen && (
        <Modal.Root isOpen={isLocationModalOpen} onOpenChange={() => setIsLocationModalOpen(false)}>
          <Modal.Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md outline-none animate-in fade-in">
            <Modal.Dialog className="pointer-events-auto flex h-fit max-w-md w-full flex-col gap-4 rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl outline-none">
              <Modal.Header className="flex items-center justify-between border-b border-border-custom pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">Set Your Clinical Location</h3>
                    <p className="text-[11px] text-text-secondary">Discover healthcare facilities and providers in Pakistan</p>
                  </div>
                </div>
                <Modal.CloseTrigger className="p-1 text-text-secondary hover:text-text-primary">
                  <X className="h-4 w-4" />
                </Modal.CloseTrigger>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3.5 py-2 text-xs text-text-primary">
                {locationError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}

                {/* Location Detection Button */}
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full text-xs font-semibold h-9"
                  isDisabled={isLocating}
                  onPress={handleDetectExactLocation}
                >
                  <Navigation className={cn("mr-1.5 h-3.5 w-3.5", isLocating && "animate-spin")} />
                  {isLocating ? "Locating..." : "Auto-Detect My Location (GPS / Network)"}
                </Button>

                <div className="flex items-center gap-2 my-1">
                  <div className="flex-1 border-t border-border-custom" />
                  <span className="text-[10px] font-semibold text-text-secondary uppercase">Major Pakistan Hubs</span>
                  <div className="flex-1 border-t border-border-custom" />
                </div>

                {/* Preset Real Area Pills for Pakistan */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-text-secondary">Popular Medical Hubs</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {PAKISTAN_PRESET_LOCATIONS.map((preset) => {
                      const isSelected = locationName === preset.name;
                      return (
                        <Button
                          key={preset.name}
                          size="sm"
                          variant={isSelected ? "primary" : "secondary"}
                          className={cn("h-7 text-[11px] rounded-lg border", isSelected ? "border-primary" : "border-border-custom")}
                          onPress={() => {
                            setLocationName(preset.name);
                            setUserCoordinates({ lat: preset.lat, lng: preset.lng });
                            setLocationAccuracy(null);
                            updateUrlQueryParams({ lat: preset.lat, lng: preset.lng, location: preset.name });
                            setIsLocationModalOpen(false);
                            setLocationError("");
                            toast.success(`Location set to ${preset.name}.`);
                          }}
                        >
                          {preset.name}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Real City Geocoding Input */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <Label className="text-xs font-semibold text-text-secondary">Custom City or Area in Pakistan</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. Lahore, Karachi, Rawalpindi, F-7 Islamabad"
                      value={customLocationInput}
                      onChange={(e) => {
                        setCustomLocationInput(e.target.value);
                        if (locationError) setLocationError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApplyCustomLocation();
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs font-semibold shrink-0"
                      isDisabled={isGeocoding || !customLocationInput.trim()}
                      onPress={handleApplyCustomLocation}
                    >
                      {isGeocoding ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        "Verify & Set"
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-text-secondary">
                    Validated via OpenStreetMap Geocoding with zero API keys required.
                  </p>
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end border-t border-border-custom pt-3">
                <Button size="sm" variant="secondary" onPress={() => setIsLocationModalOpen(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Backdrop>
        </Modal.Root>
      )}

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
                      {bookingDoctor.subTitle} • {bookingDoctor.consultationFee} PKR
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
