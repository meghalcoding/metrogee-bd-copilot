import "server-only";
import type { ProspectResult } from "../types";
import { categoryQuery } from "../categories";

type FoursquarePlace = {
  fsq_id?: string;
  name?: string;
  distance?: number;
  categories?: Array<{ name?: string }>;
  location?: { formatted_address?: string; address?: string; locality?: string; region?: string; postcode?: string };
  geocodes?: { main?: { latitude?: number; longitude?: number } };
  tel?: string;
  website?: string;
  closed_bucket?: string;
  rating?: number;
};

export async function searchFoursquare(slug: string, categoryName: string, lat: number, lon: number, radiusKm: number): Promise<ProspectResult[]> {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) throw new Error("FOURSQUARE_API_KEY is not configured.");
  const url = new URL("https://places-api.foursquare.com/places/search");
  url.searchParams.set("query", categoryQuery(slug, categoryName));
  url.searchParams.set("ll", `${lat},${lon}`);
  url.searchParams.set("radius", String(Math.min(radiusKm * 1000, 100000)));
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort", "DISTANCE");

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${key}`,
      "X-Places-Api-Version": "2025-06-17",
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Foursquare returned ${response.status}.`);
  const payload = (await response.json()) as { results?: FoursquarePlace[] };

  return (payload.results ?? []).map((place): ProspectResult => {
    const address = place.location?.formatted_address ?? null;
    const latitude = place.geocodes?.main?.latitude ?? null;
    const longitude = place.geocodes?.main?.longitude ?? null;
    const name = place.name ?? "Unnamed place";
    return {
      provider: "foursquare",
      providerPlaceId: place.fsq_id ?? `${name}:${latitude}:${longitude}`,
      name,
      formattedAddress: address,
      latitude,
      longitude,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`,
      providerUrl: place.fsq_id ? `https://foursquare.com/v/${place.fsq_id}` : null,
      phone: place.tel ?? null,
      email: null,
      websiteUrl: place.website ?? null,
      rating: place.rating ?? null,
      reviewCount: null,
      types: (place.categories ?? []).map((item) => item.name ?? "").filter(Boolean),
      businessStatus: place.closed_bucket ?? null,
      distanceKm: typeof place.distance === "number" ? place.distance / 1000 : null,
      raw: place as unknown as Record<string, unknown>,
    };
  });
}
