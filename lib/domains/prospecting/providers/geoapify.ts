import "server-only";
import type { ProspectResult } from "../types";
import { geoapifyCategories } from "../categories";

export async function searchGeoapify(
  slug: string,
  categoryName: string,
  lat: number,
  lon: number,
  radiusKm: number,
  customQuery = "",
): Promise<ProspectResult[]> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) throw new Error("GEOAPIFY_API_KEY is not configured.");

  const categories = geoapifyCategories(slug);
  const url = new URL("https://api.geoapify.com/v2/places");

  if (categories) {
    // Category mode: filter by Geoapify category codes
    url.searchParams.set("categories", categories);
    url.searchParams.set("filter", `circle:${lon},${lat},${radiusKm * 1000}`);
    url.searchParams.set("bias", `proximity:${lon},${lat}`);
  } else {
    // Free-text / custom mode: use text search with location bias
    const textUrl = new URL("https://api.geoapify.com/v1/geocode/search");
    textUrl.searchParams.set("text", customQuery || categoryName);
    textUrl.searchParams.set("filter", `circle:${lon},${lat},${radiusKm * 1000}`);
    textUrl.searchParams.set("bias", `proximity:${lon},${lat}`);
    textUrl.searchParams.set("type", "amenity");
    textUrl.searchParams.set("limit", "20");
    textUrl.searchParams.set("lang", "en");
    textUrl.searchParams.set("apiKey", key);

    const r = await fetch(textUrl, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    if (!r.ok) {
      const msgs: Record<number, string> = { 401: "API key invalid.", 403: "Access denied.", 429: "Rate limit reached." };
      throw new Error(`Geoapify returned ${r.status}: ${msgs[r.status] ?? "Provider error."}`);
    }
    const payload = (await r.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };
    return mapFeatures(payload.features ?? []);
  }

  url.searchParams.set("limit", "40");
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", key);

  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "API key is invalid or missing.",
      403: "API access was denied.",
      429: "Rate or daily quota limit reached.",
    };
    throw new Error(`Geoapify returned ${response.status}: ${messages[response.status] ?? "Provider error."}`);
  }
  const data = (await response.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };
  return mapFeatures(data.features ?? []);
}

function mapFeatures(features: Array<{ properties?: Record<string, unknown> }>): ProspectResult[] {
  return features.map((feature): ProspectResult => {
    const p = feature.properties ?? {};
    const name = String(p.name ?? p.address_line1 ?? "Unnamed place");
    const address = String(p.formatted ?? p.address_line1 ?? "") || null;
    const latitude = typeof p.lat === "number" ? p.lat : null;
    const longitude = typeof p.lon === "number" ? p.lon : null;

    return {
      provider: "geoapify",
      providerPlaceId: String(p.place_id ?? `${latitude}:${longitude}:${name}`),
      name,
      formattedAddress: address,
      city: typeof p.city === "string" ? p.city : (typeof p.county === "string" ? p.county : null),
      regionState: typeof p.state === "string" ? p.state : null,
      country: typeof p.country === "string" ? p.country : null,
      latitude,
      longitude,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`,
      providerUrl: null,
      phone: typeof p.contact_phone === "string" ? p.contact_phone : null,
      email: typeof p.contact_email === "string" ? p.contact_email : null,
      websiteUrl: typeof p.website === "string" ? p.website : null,
      rating: null,
      reviewCount: null,
      types: Array.isArray(p.categories) ? p.categories.map(String).slice(0, 5) : [],
      businessStatus: null,
      distanceKm: null,
      openingHours: null,
      socialLinks: {},
      raw: p,
    };
  });
}
