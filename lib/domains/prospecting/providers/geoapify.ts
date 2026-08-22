import "server-only";
import type { ProspectResult } from "../types";
import { providerCategory } from "../categories";

export async function searchGeoapify(slug: string, categoryName: string, lat: number, lon: number, radiusKm: number): Promise<ProspectResult[]> {
  const key = process.env.GEOAPIFY_API_KEY;
  if (!key) throw new Error("GEOAPIFY_API_KEY is not configured.");
  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", String(providerCategory(slug, "geoapify", categoryName)));
  url.searchParams.set("filter", `circle:${lon},${lat},${radiusKm * 1000}`);
  url.searchParams.set("bias", `proximity:${lon},${lat}`);
  url.searchParams.set("limit", "20");
  url.searchParams.set("lang", "en");
  url.searchParams.set("apiKey", key);

  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error(`Geoapify returned ${response.status}.`);
  const payload = (await response.json()) as { features?: Array<{ properties?: Record<string, unknown> }> };

  return (payload.features ?? []).map((feature): ProspectResult => {
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
      raw: p,
    };
  });
}
