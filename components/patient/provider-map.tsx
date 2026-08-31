"use client";

import { Button, Card, Chip, Input, Label, Tooltip } from "@heroui/react";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarCheck,
  Check,
  Compass,
  Crosshair,
  FlaskConical,
  Globe2,
  Layers,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Pill,
  Plus,
  Satellite,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import type { DirectoryEntity } from "@/app/api/directory/route";
import { reverseGeocodeCoords } from "@/lib/geo-location";
import { cn } from "@/lib/utils";

interface ProviderMapProps {
  providers: DirectoryEntity[];
  selectedProviderId?: string | null;
  onSelectProvider: (provider: DirectoryEntity) => void;
  onBookDoctor?: (doctor: DirectoryEntity) => void;
  userCoordinates?: { lat: number; lng: number } | null;
  locationName?: string;
  searchRadiusKm?: number;
  onUpdateLocationCoordinates?: (coords: { lat: number; lng: number }, name?: string) => void;
  onExpandRadius?: (newRadius: number) => void;
  onDetectLocation?: () => void;
  isLocating?: boolean;
  className?: string;
}

// ─── TILE LAYERS (Satellite Default + OpenStreetMap - Zero API Keys) ───────
const MAP_LAYERS = {
  SATELLITE: {
    name: "Satellite Imagery (High-Res)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    subdomains: "abc",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    maxZoom: 19,
    isSatellite: true,
  },
  STANDARD: {
    name: "OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
    isSatellite: false,
  },
  HOT: {
    name: "OpenStreetMap Humanitarian (HOT)",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: "&copy; OpenStreetMap & Humanitarian Team",
    maxZoom: 19,
    isSatellite: false,
  },
  TOPO: {
    name: "OpenTopoMap Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: "&copy; OpenStreetMap & OpenTopoMap",
    maxZoom: 17,
    isSatellite: false,
  },
};

const ENTITY_CONFIG: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    label: string;
    svgIcon: string;
  }
> = {
  DOCTOR: {
    icon: Stethoscope,
    color: "#0D9488",
    bgColor: "rgba(13, 148, 136, 0.2)",
    label: "Doctor",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>`,
  },
  HOSPITAL: {
    icon: Building2,
    color: "#0284C7",
    bgColor: "rgba(2, 132, 199, 0.2)",
    label: "Hospital",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>`,
  },
  PHARMACY: {
    icon: Pill,
    color: "#DB2777",
    bgColor: "rgba(219, 39, 119, 0.2)",
    label: "Pharmacy",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
  },
  LAB: {
    icon: FlaskConical,
    color: "#7C3AED",
    bgColor: "rgba(124, 58, 237, 0.2)",
    label: "Lab",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`,
  },
};

export function ProviderMap({
  providers,
  selectedProviderId,
  onSelectProvider,
  onBookDoctor,
  userCoordinates = { lat: 31.5204, lng: 74.3587 }, // Default Lahore, Pakistan
  locationName = "Lahore Medical Center",
  searchRadiusKm = 25,
  onUpdateLocationCoordinates,
  onExpandRadius,
  onDetectLocation,
  isLocating = false,
  className,
}: ProviderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  // Satellite view is default
  const [activeLayer, setActiveLayer] = useState<keyof typeof MAP_LAYERS>("SATELLITE");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeProvider, setActiveProvider] = useState<DirectoryEntity | null>(null);
  const [coordSearchInput, setCoordSearchInput] = useState("");
  const [isCoordSearchOpen, setIsCoordSearchOpen] = useState(false);
  const [isPinDropping, setIsPinDropping] = useState(false);

  const currentCenter = userCoordinates || { lat: 31.5204, lng: 74.3587 };

  // Only plot providers that are strictly within the search radius circle
  const providersInCircle = useMemo(() => {
    return providers.filter((p) => {
      if (p.distanceKm !== undefined) {
        return p.distanceKm <= searchRadiusKm;
      }
      return true;
    });
  }, [providers, searchRadiusKm]);

  // Load Leaflet dynamically and initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !mapElementRef.current) return;

    let isMounted = true;

    // Ensure Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = async () => {
      let L = (window as any).L;
      if (!L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject();
          document.body.appendChild(script);
        });
        L = (window as any).L;
      }

      if (!isMounted || !mapElementRef.current || !L) return;

      // Clean up previous instance if exists
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // Initialize Leaflet Map
      const map = L.map(mapElementRef.current, {
        center: [currentCenter.lat, currentCenter.lng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      leafletMapRef.current = map;

      // Add Tile Layer
      const tileConfig = MAP_LAYERS[activeLayer];
      const tileLayer = L.tileLayer(tileConfig.url, {
        subdomains: tileConfig.subdomains,
        maxZoom: tileConfig.maxZoom,
      }).addTo(map);

      (map as any)._activeTileLayerInstance = tileLayer;

      // Add Center / User Location Pin with Clean Icon
      const userIcon = L.divIcon({
        className: "custom-user-marker",
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #0D9488; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="22" x2="18" y1="12" y2="12"/><line x1="6" x2="2" y1="12" y2="12"/><line x1="12" x2="12" y1="6" y2="2"/><line x1="12" x2="12" y1="22" y2="18"/></svg>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const userMarker = L.marker([currentCenter.lat, currentCenter.lng], { icon: userIcon })
        .addTo(map)
        .bindTooltip(`📍 Center: ${locationName}`, { direction: "top", offset: [0, -10] });
      userMarkerRef.current = userMarker;

      // Track cursor coordinates
      map.on("mousemove", (e: any) => {
        setHoveredCoords({
          lat: parseFloat(e.latlng.lat.toFixed(4)),
          lng: parseFloat(e.latlng.lng.toFixed(4)),
        });
      });

      // Click anywhere to place new center pin and auto reverse geocode
      map.on("click", async (e: any) => {
        const newCoords = {
          lat: parseFloat(e.latlng.lat.toFixed(5)),
          lng: parseFloat(e.latlng.lng.toFixed(5)),
        };

        setIsPinDropping(true);
        try {
          const rev = await reverseGeocodeCoords(newCoords.lat, newCoords.lng);
          const name = rev.displayName || `Pin (${newCoords.lat.toFixed(3)}°, ${newCoords.lng.toFixed(3)}°)`;
          if (onUpdateLocationCoordinates) {
            onUpdateLocationCoordinates(newCoords, name);
          }
        } finally {
          setIsPinDropping(false);
        }
      });

      // Markers Layer Group
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      renderProviderMarkers(L, map, markersGroup);
    };

    loadLeaflet().catch((err) => console.error("Error loading Leaflet Map:", err));

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update tile layer on change
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (map._activeTileLayerInstance) {
      map.removeLayer(map._activeTileLayerInstance);
    }

    const tileConfig = MAP_LAYERS[activeLayer];
    const newTileLayer = L.tileLayer(tileConfig.url, {
      subdomains: tileConfig.subdomains,
      maxZoom: tileConfig.maxZoom,
    }).addTo(map);

    map._activeTileLayerInstance = newTileLayer;
  }, [activeLayer]);

  // Render clean SVG Pin Badges with entity icons (No dotted circles)
  const renderProviderMarkers = (L: any, map: any, group: any) => {
    group.clearLayers();

    providersInCircle.forEach((item) => {
      const isSelected = item.id === selectedProviderId;
      const config = ENTITY_CONFIG[item.entityType] || ENTITY_CONFIG.DOCTOR;

      const markerHtml = `
        <div style="
          position: relative;
          width: ${isSelected ? "42px" : "36px"};
          height: ${isSelected ? "48px" : "42px"};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.6));
          transform: ${isSelected ? "scale(1.12)" : "scale(1)"};
          transition: transform 0.2s ease;
        ">
          <!-- Pin Head with Entity Icon -->
          <div style="
            width: ${isSelected ? "38px" : "32px"};
            height: ${isSelected ? "38px" : "32px"};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            background: ${config.color};
            border: ${isSelected ? "3px solid #FFFFFF" : "2px solid #FFFFFF"};
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: ${isSelected ? `0 0 16px ${config.color}` : `0 2px 8px rgba(0,0,0,0.4)`};
          ">
            <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
              ${config.svgIcon}
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-provider-pin",
        html: markerHtml,
        iconSize: isSelected ? [42, 48] : [36, 42],
        iconAnchor: isSelected ? [21, 44] : [18, 38],
      });

      const marker = L.marker([item.latitude, item.longitude], {
        icon: customIcon,
      }).addTo(group);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: ${config.color};">${item.entityType}</span>
            <span style="font-size: 10px; color: #666; font-weight: 600;">${item.distanceKm !== undefined ? `${item.distanceKm} km away` : ""}</span>
          </div>
          <div style="font-size: 13px; font-weight: bold; color: #111;">${item.entityType === "DOCTOR" ? `Dr. ${item.name}` : item.name}</div>
          <div style="font-size: 11px; color: #444; margin-top: 2px;">${item.subTitle || item.location}</div>
          <div style="font-size: 10px; font-family: monospace; color: #666; margin-top: 4px; background: #f3f4f6; padding: 2px 4px; border-radius: 4px;">
            📍 ${item.latitude.toFixed(4)}°, ${item.longitude.toFixed(4)}°
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { offset: [0, -25] });

      marker.on("click", () => {
        setActiveProvider(item);
        onSelectProvider(item);
      });
    });
  };

  // Sync center and markers
  useEffect(() => {
    const map = leafletMapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    map.setView([currentCenter.lat, currentCenter.lng], map.getZoom());

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([currentCenter.lat, currentCenter.lng]);
      userMarkerRef.current.setTooltipContent(`📍 Center: ${locationName}`);
    }

    if (markersGroupRef.current) {
      renderProviderMarkers(L, map, markersGroupRef.current);
    }
  }, [providersInCircle, currentCenter, searchRadiusKm, selectedProviderId]);

  // Focus provider on map
  useEffect(() => {
    if (!selectedProviderId || !leafletMapRef.current) return;
    const found = providersInCircle.find((p) => p.id === selectedProviderId);
    if (found) {
      setActiveProvider(found);
      leafletMapRef.current.flyTo([found.latitude, found.longitude], 14, {
        duration: 0.8,
      });
    }
  }, [selectedProviderId, providersInCircle]);

  // Handle native Fullscreen + InvalidateSize
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        setIsFullscreen(!isFullscreen);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    }

    setTimeout(() => {
      leafletMapRef.current?.invalidateSize();
    }, 200);
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(() => {
        leafletMapRef.current?.invalidateSize();
      }, 150);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleZoomIn = () => leafletMapRef.current?.zoomIn();
  const handleZoomOut = () => leafletMapRef.current?.zoomOut();

  const handleLocateMe = async () => {
    if (onDetectLocation) {
      onDetectLocation();
    }
    leafletMapRef.current?.flyTo([currentCenter.lat, currentCenter.lng], 13, { duration: 0.8 });
  };

  const handleFitAll = () => {
    const L = (window as any).L;
    if (!leafletMapRef.current || !L || providersInCircle.length === 0) return;
    const bounds = L.latLngBounds(providersInCircle.map((p) => [p.latitude, p.longitude]));
    bounds.extend([currentCenter.lat, currentCenter.lng]);
    leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
  };

  const handleSearchCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = coordSearchInput.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const coords = { lat: parts[0], lng: parts[1] };
      if (onUpdateLocationCoordinates) {
        onUpdateLocationCoordinates(coords, `Pin (${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°)`);
      }
      leafletMapRef.current?.flyTo([coords.lat, coords.lng], 13);
      setIsCoordSearchOpen(false);
      setCoordSearchInput("");
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border-custom bg-surface shadow-xl select-none",
        isFullscreen && "fixed inset-0 z-[9999] rounded-none border-none",
        className,
      )}
    >
      {/* Top Map Toolbar Controls */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Active Location & Radius Badge */}
        <div className="flex items-center gap-2 rounded-xl border border-border-custom/80 bg-surface/90 px-3 py-1.5 backdrop-blur-md pointer-events-auto shadow-md">
          <MapPin className="h-4 w-4 text-primary animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
              Search Center
            </span>
            <span className="text-xs font-bold text-text-primary truncate max-w-44">
              {isPinDropping ? "Locating pin..." : locationName}
            </span>
          </div>
          <Chip size="sm" variant="soft" className="ml-1 text-[10px] font-mono">
            {searchRadiusKm}km
          </Chip>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Coordinate Search Dropdown Toggle */}
          <div className="relative">
            <Tooltip delay={100}>
              <Tooltip.Trigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant={isCoordSearchOpen ? "primary" : "secondary"}
                  className="h-8 w-8 min-w-8 rounded-xl border border-border-custom/80 bg-surface/90 backdrop-blur-md"
                  onPress={() => setIsCoordSearchOpen(!isCoordSearchOpen)}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content className="px-2 py-1 text-xs">Jump to Coordinates</Tooltip.Content>
            </Tooltip>

            {isCoordSearchOpen && (
              <div className="absolute right-0 top-10 w-64 rounded-xl border border-border-custom bg-surface p-3 shadow-xl backdrop-blur-xl animate-in fade-in z-50">
                <form onSubmit={handleSearchCoords} className="flex flex-col gap-2">
                  <Label className="text-xs font-semibold text-text-secondary">
                    Enter Lat, Lng
                  </Label>
                  <Input
                    placeholder="e.g. 31.5204, 74.3587"
                    value={coordSearchInput}
                    onChange={(e) => setCoordSearchInput(e.target.value)}
                  />
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onPress={() => setIsCoordSearchOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" variant="primary" type="submit" className="h-7 text-xs">
                      Go
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Map Layer Switcher (Satellite / OSM / Terrain) */}
          <div className="relative">
            <Tooltip delay={100}>
              <Tooltip.Trigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant={isLayersOpen ? "primary" : "secondary"}
                  className="h-8 w-8 min-w-8 rounded-xl border border-border-custom/80 bg-surface/90 backdrop-blur-md"
                  onPress={() => setIsLayersOpen(!isLayersOpen)}
                >
                  {MAP_LAYERS[activeLayer].isSatellite ? (
                    <Satellite className="h-3.5 w-3.5 text-sky-400" />
                  ) : (
                    <Layers className="h-3.5 w-3.5" />
                  )}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content className="px-2 py-1 text-xs">Map Layers & Satellite View</Tooltip.Content>
            </Tooltip>

            {isLayersOpen && (
              <div className="absolute right-0 top-10 w-60 rounded-xl border border-border-custom bg-surface p-2 shadow-xl backdrop-blur-xl animate-in fade-in z-50 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-text-secondary uppercase px-2 py-1">
                  Map & Satellite Layers
                </span>
                {Object.entries(MAP_LAYERS).map(([key, conf]) => (
                  <button
                    key={key}
                    type="button"
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors text-left",
                      activeLayer === key
                        ? "bg-primary text-white"
                        : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
                    )}
                    onClick={() => {
                      setActiveLayer(key as keyof typeof MAP_LAYERS);
                      setIsLayersOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      {conf.isSatellite ? <Satellite className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
                      <span>{conf.name}</span>
                    </div>
                    {activeLayer === key && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Locate Me Button */}
          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                className="h-8 w-8 min-w-8 rounded-xl border border-border-custom/80 bg-surface/90 backdrop-blur-md"
                isDisabled={isLocating}
                onPress={handleLocateMe}
              >
                <Crosshair className={cn("h-3.5 w-3.5 text-primary", isLocating && "animate-spin")} />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs">
              {isLocating ? "Locating..." : "Auto-Detect My Location"}
            </Tooltip.Content>
          </Tooltip>

          {/* Fit All Providers */}
          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                className="h-8 w-8 min-w-8 rounded-xl border border-border-custom/80 bg-surface/90 backdrop-blur-md"
                onPress={handleFitAll}
              >
                <Compass className="h-3.5 w-3.5" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs">Fit All Providers in View</Tooltip.Content>
          </Tooltip>

          {/* Zoom Buttons */}
          <div className="flex items-center rounded-xl border border-border-custom/80 bg-surface/90 p-0.5 backdrop-blur-md">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="h-7 w-7 min-w-7 rounded-lg"
              onPress={handleZoomIn}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              className="h-7 w-7 min-w-7 rounded-lg"
              onPress={handleZoomOut}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Fullscreen Toggle */}
          <Tooltip delay={100}>
            <Tooltip.Trigger>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                className="h-8 w-8 min-w-8 rounded-xl border border-border-custom/80 bg-surface/90 backdrop-blur-md"
                onPress={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content className="px-2 py-1 text-xs">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            </Tooltip.Content>
          </Tooltip>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div ref={mapElementRef} className="h-full w-full flex-1 z-[10]" />

      {/* Empty Area Overlay when no providers inside radius circle */}
      {providersInCircle.length === 0 && (
        <div className="absolute inset-0 z-[420] flex items-center justify-center p-4 pointer-events-none">
          <Card className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border-custom bg-surface/95 p-6 shadow-2xl backdrop-blur-xl text-center max-w-sm pointer-events-auto">
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
            {onExpandRadius && (
              <Button
                size="sm"
                variant="primary"
                className="text-xs font-semibold"
                onPress={() => onExpandRadius(searchRadiusKm < 50 ? 50 : 100)}
              >
                Expand Search Radius ({searchRadiusKm < 50 ? "50 km" : "100 km"})
              </Button>
            )}
          </Card>
        </div>
      )}

      {/* Bottom Floating Bar: Coordinates Tracker & Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Live Hover Coordinates */}
        <div className="flex items-center gap-2 rounded-xl border border-border-custom/80 bg-surface/90 px-3 py-1 text-[11px] font-mono text-text-secondary backdrop-blur-md pointer-events-auto">
          <span>
            Lat: {hoveredCoords?.lat ?? currentCenter.lat.toFixed(4)}°, Lng:{" "}
            {hoveredCoords?.lng ?? currentCenter.lng.toFixed(4)}°
          </span>
          <span className="text-[10px] text-text-secondary/70">| Click map to set pin</span>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-border-custom/80 bg-surface/90 px-3 py-1 backdrop-blur-md pointer-events-auto text-[11px]">
          {Object.entries(ENTITY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px]"
                  style={{ backgroundColor: config.bgColor, color: config.color, border: `1px solid ${config.color}` }}
                >
                  <Icon className="h-2 w-2" />
                </span>
                <span className="text-text-secondary">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Provider Card Overlay */}
      {activeProvider && (
        <div className="absolute bottom-12 left-3 right-3 z-[450] max-w-md mx-auto animate-in slide-in-from-bottom-3 duration-200">
          <Card className="flex flex-col gap-3 rounded-2xl border border-primary/40 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-primary"
                  style={{
                    backgroundColor: (ENTITY_CONFIG[activeProvider.entityType] || ENTITY_CONFIG.DOCTOR).bgColor,
                    borderColor: (ENTITY_CONFIG[activeProvider.entityType] || ENTITY_CONFIG.DOCTOR).color,
                  }}
                >
                  {(() => {
                    const Icon = (ENTITY_CONFIG[activeProvider.entityType] || ENTITY_CONFIG.DOCTOR).icon;
                    return <Icon className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-text-primary line-clamp-1">
                      {activeProvider.entityType === "DOCTOR" ? `Dr. ${activeProvider.name}` : activeProvider.name}
                    </h3>
                    {activeProvider.isVerified && (
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-primary line-clamp-1">
                    {activeProvider.subTitle || "Healthcare Provider"}
                  </p>
                </div>
              </div>

              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="h-7 w-7 min-w-7 rounded-full text-text-secondary hover:text-text-primary"
                onPress={() => setActiveProvider(null)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs text-text-secondary border-t border-border-custom/80 pt-2.5">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary" />
                <span className="truncate">{activeProvider.location}</span>
                {activeProvider.distanceKm !== undefined && (
                  <Chip size="sm" variant="soft" className="ml-1 text-[9px] font-mono">
                    {activeProvider.distanceKm} km
                  </Chip>
                )}
              </div>

              {activeProvider.consultationFee !== undefined && (
                <span className="font-bold text-text-primary shrink-0">
                  {activeProvider.consultationFee} PKR
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                className="text-xs font-semibold h-8"
                onPress={() => onSelectProvider(activeProvider)}
              >
                Focus in List
              </Button>

              {activeProvider.entityType === "DOCTOR" && activeProvider.isVerified && onBookDoctor && (
                <Button
                  size="sm"
                  variant="primary"
                  className="text-xs font-semibold h-8"
                  onPress={() => onBookDoctor(activeProvider)}
                >
                  <CalendarCheck className="mr-1 h-3.5 w-3.5" /> Book Slot
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
