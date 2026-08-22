import "server-only";
import type { ProspectResult } from "../types";
import { providerCategory } from "../categories";

type MapplsPlace = {
  eLoc?: string;
  placeName?: string;
  placeAddress?: string;
  distance?: number;
  mobileNo?: string;
  landlineNo?: string;
  email?: string;
  keywords?: string[];
  type?: string;
};

export async function searchMappls(slug: string, categoryName: string, lat: number, lon: number, radiusKm: number): Promise<ProspectResult[]> {
  const key = process.env.MAPPLS_ACCESS_TOKEN;
  if (!key) throw new Error("MAPPLS_ACCESS_TOKEN is not configured.");
  const url = new URL("https://search.mappls.com/search/places/nearby/json");
  url.searchParams.set("keywords", String(providerCategory(slug, "mappls", categoryName)));
  url.searchParams.set("refLocation", `${lat},${lon}`);
  url.searchParams.set("region", "IND");
  url.searchParams.set("radius", String(Math.min(Math.max(radiusKm * 1000, 500), 10000)));
  url.searchParams.set("sortBy", "dist:asc");
  url.searchParams.set("page", "1");
  url.searchParams.set("access_token", key);

  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error(`Mappls returned ${response.status}.`);
  const payload = (await response.json()) as { suggestedLocations?: MapplsPlace[] };

  return (payload.suggestedLocations ?? []).map((place): ProspectResult => {
    const name = place.placeName ?? "Unnamed place";
    const address = place.placeAddress ?? null;
    return {
      provider: "mappls",
      providerPlaceId: place.eLoc ?? `${name}:${place.distance ?? 0}`,
      name,
      formattedAddress: address,
      latitude: null,
      longitude: null,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`,
      providerUrl: place.eLoc ? `https://mappls.com/${place.eLoc}` : null,
      phone: place.mobileNo || place.landlineNo || null,
      email: place.email || null,
      websiteUrl: null,
      rating: null,
      reviewCount: null,
      types: place.keywords ?? [place.type ?? "POI"],
      businessStatus: null,
      distanceKm: typeof place.distance === "number" ? place.distance / 1000 : null,
      raw: place as unknown as Record<string, unknown>,
    };
  });
}
