/**
 * Comprehensive Geo-Location & Reverse Geocoding Utility for Medicio
 * Zero external API keys required. Uses OpenStreetMap Nominatim & Seamless Geolocation.
 */

export interface LocationResult {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  displayName: string;
  city?: string;
  area?: string;
  source: "GPS" | "IP" | "NOMINATIM" | "DEFAULT";
}

// Default fallback to Lahore, Pakistan
export const DEFAULT_PAKISTAN_LOCATION: LocationResult = {
  lat: 31.5204,
  lng: 74.3587,
  displayName: "Lahore, Punjab, Pakistan",
  city: "Lahore",
  area: "Gulberg / Central",
  source: "DEFAULT",
};

/**
 * Reverse geocodes exact coordinates into a human-readable address using OpenStreetMap Nominatim
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
): Promise<{ displayName: string; city?: string; area?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = await res.json();

    if (data && data.address) {
      const addr = data.address;
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.road ||
        addr.quarter ||
        addr.commercial;
      const city =
        addr.city || addr.town || addr.municipality || addr.state_district || addr.county || addr.state;
      const country = addr.country || "Pakistan";

      let parts: string[] = [];
      if (area) parts.push(area);
      if (city && city !== area) parts.push(city);
      if (country && !city?.includes(country)) parts.push(country);

      const displayName = parts.length > 0 ? parts.join(", ") : data.display_name.split(",").slice(0, 2).join(",");
      return { displayName, city, area };
    }

    return {
      displayName: `Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
    };
  } catch (err) {
    console.warn("[GEO] Reverse geocode error:", err);
    return {
      displayName: `Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
    };
  }
}

/**
 * Forward geocodes a city, postal code, or place name using OpenStreetMap Nominatim
 */
export async function forwardGeocodePlace(
  query: string,
): Promise<LocationResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    // If country not specified, prioritize Pakistan
    const searchTarget = trimmed.toLowerCase().includes("pakistan")
      ? trimmed
      : `${trimmed}, Pakistan`;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchTarget,
    )}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) throw new Error("Forward geocode failed");
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      const match = data[0];
      const lat = parseFloat(parseFloat(match.lat).toFixed(5));
      const lng = parseFloat(parseFloat(match.lon).toFixed(5));

      const addr = match.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.road;
      const city = addr.city || addr.town || addr.state_district || addr.state;
      const parts = match.display_name.split(",");
      const displayName = parts.slice(0, 2).join(",").trim();

      return {
        lat,
        lng,
        displayName,
        city,
        area,
        source: "NOMINATIM",
      };
    }
    return null;
  } catch (err) {
    console.error("[GEO] Forward geocode error:", err);
    return null;
  }
}

/**
 * Multi-service IP-based geolocation fallback (Zero permissions required, 100% reliable)
 */
export async function getIpGeolocation(): Promise<LocationResult> {
  // Service 1: ipwho.is
  try {
    const res = await fetch("https://ipwho.is/", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.latitude && data.longitude) {
        const lat = parseFloat(parseFloat(data.latitude).toFixed(5));
        const lng = parseFloat(parseFloat(data.longitude).toFixed(5));
        const city = data.city || "Lahore";
        const region = data.region || "Punjab";
        return {
          lat,
          lng,
          displayName: `${city}, ${region}`,
          city,
          area: region,
          source: "IP",
        };
      }
    }
  } catch {
    // continue to backup
  }

  // Service 2: freeipapi.com
  try {
    const res2 = await fetch("https://freeipapi.com/api/json", { cache: "no-store" });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.latitude && data2.longitude) {
        const lat = parseFloat(parseFloat(data2.latitude).toFixed(5));
        const lng = parseFloat(parseFloat(data2.longitude).toFixed(5));
        const city = data2.cityName || "Lahore";
        const region = data2.regionName || "Punjab";
        return {
          lat,
          lng,
          displayName: `${city}, ${region}`,
          city,
          area: region,
          source: "IP",
        };
      }
    }
  } catch {
    // continue to default
  }

  return DEFAULT_PAKISTAN_LOCATION;
}

/**
 * Seamless user location detector:
 * 1. Tries hardware GPS / Wi-Fi triangulation if allowed
 * 2. Immediately & silently falls back to Network/IP geolocation if GPS is unavailable or blocked
 * 3. Never throws permission errors or gets stuck!
 */
export async function getExactUserLocation(): Promise<LocationResult> {
  if (typeof window !== "undefined" && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 0,
        });
      });

      const lat = parseFloat(pos.coords.latitude.toFixed(5));
      const lng = parseFloat(pos.coords.longitude.toFixed(5));
      const accuracyMeters = Math.round(pos.coords.accuracy);

      const { displayName, city, area } = await reverseGeocodeCoords(lat, lng);

      return {
        lat,
        lng,
        accuracyMeters,
        displayName,
        city,
        area,
        source: "GPS",
      };
    } catch {
      // Seamlessly proceed to IP geolocation
    }
  }

  return await getIpGeolocation();
}
