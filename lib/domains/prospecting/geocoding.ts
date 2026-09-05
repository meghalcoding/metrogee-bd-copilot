import "server-only";

export type ResolvedLocation = {
  postalCode: string;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
};

function timeoutSignal(ms = 12000) {
  return AbortSignal.timeout(ms);
}

/** India Post API — only works for 6-digit Indian PIN codes */
async function indiaPostLookup(pin: string): Promise<{ city: string | null; state: string | null } | null> {
  if (!/^\d{6}$/.test(pin)) return null;
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: timeoutSignal(8000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{ District?: string; State?: string }> | null;
    }>;
    const office = payload[0]?.PostOffice?.[0];
    if (!office) return null;
    return { city: office.District ?? null, state: office.State ?? null };
  } catch {
    return null;
  }
}

/** Geoapify geocoder — works globally, needs API key */
async function geocodeGeoapify(query: string, countryCode?: string): Promise<ResolvedLocation | null> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) return null;
  try {
    const url = new URL("https://api.geoapify.com/v1/geocode/search");
    url.searchParams.set("text", query);
    if (countryCode) url.searchParams.set("filter", `countrycode:${countryCode.toLowerCase()}`);
    url.searchParams.set("limit", "1");
    url.searchParams.set("apiKey", key);
    const response = await fetch(url, { signal: timeoutSignal(), cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      features?: Array<{
        properties?: {
          lat?: number; lon?: number;
          city?: string; state?: string; country?: string; country_code?: string;
        };
      }>;
    };
    const p = data.features?.[0]?.properties;
    if (typeof p?.lat !== "number" || typeof p?.lon !== "number") return null;
    return {
      postalCode: query,
      city: p.city ?? null,
      state: p.state ?? null,
      country: p.country ?? null,
      latitude: p.lat,
      longitude: p.lon,
    };
  } catch {
    return null;
  }
}

/** Nominatim (OSM) — free, works globally, rate-limited to 1 req/s */
async function geocodeNominatim(query: string, countryCode?: string): Promise<ResolvedLocation | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");
    if (countryCode) url.searchParams.set("countrycodes", countryCode.toLowerCase());

    const response = await fetch(url, {
      signal: timeoutSignal(),
      cache: "no-store",
      headers: { "User-Agent": "MetroGee-BD-Copilot/1.0 (CRM prospecting tool)" },
    });
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{
      lat?: string; lon?: string;
      address?: {
        city?: string; town?: string; village?: string; county?: string;
        state?: string; country?: string; country_code?: string;
        postcode?: string;
      };
    }>;
    const first = results[0];
    const lat = Number(first?.lat);
    const lon = Number(first?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const addr = first.address ?? {};
    return {
      postalCode: query,
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? null,
      state: addr.state ?? null,
      country: addr.country ?? null,
      latitude: lat,
      longitude: lon,
    };
  } catch {
    return null;
  }
}

/**
 * Resolve any postal code worldwide to lat/lon + city/state.
 * Falls back through: Geoapify → Nominatim.
 * For Indian 6-digit PIN codes, also enriches city/state via India Post.
 */
export async function resolvePostalCode(
  postalCode: string,
  countryCode?: string,
): Promise<ResolvedLocation> {
  const code = postalCode.trim();
  if (!code) throw new Error("Enter a postal or ZIP code.");

  // Build a good geocoding query
  const geoQuery = countryCode ? `${code}, ${countryCode.toUpperCase()}` : code;

  // Run geocoding + India Post (if applicable) in parallel
  const isIndianPin = /^\d{6}$/.test(code) && (!countryCode || countryCode.toLowerCase() === "in");

  const [geoResult, indiaPostResult] = await Promise.all([
    geocodeGeoapify(geoQuery, countryCode) ?? geocodeNominatim(geoQuery, countryCode),
    isIndianPin ? indiaPostLookup(code) : Promise.resolve(null),
  ]);

  // Resolve geocoordinates — try in order
  const coords =
    (await geocodeGeoapify(geoQuery, countryCode)) ??
    (await geocodeNominatim(geoQuery, countryCode));

  if (!coords) {
    throw new Error(
      `Could not find coordinates for postal code "${code}"${countryCode ? ` in ${countryCode.toUpperCase()}` : ""}. Check the code and country.`,
    );
  }

  return {
    postalCode: code,
    city: indiaPostResult?.city ?? coords.city ?? (geoResult as ResolvedLocation | null)?.city ?? null,
    state: indiaPostResult?.state ?? coords.state ?? (geoResult as ResolvedLocation | null)?.state ?? null,
    country: coords.country ?? null,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

/** Legacy alias so existing enrichment.ts doesn't break */
export async function resolveIndianPin(pin: string): Promise<ResolvedLocation> {
  return resolvePostalCode(pin, "in");
}
