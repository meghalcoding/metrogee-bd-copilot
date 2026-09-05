import "server-only";
import type { ProspectResult } from "../types";
import { categoryQuery } from "../categories";

type FoursquarePlace = {
  fsq_id?: string;
  name?: string;
  distance?: number;
  categories?: Array<{ name?: string }>;
  location?: {
    formatted_address?: string;
    address?: string;
    locality?: string;
    region?: string;
    country?: string;
    postcode?: string;
  };
  geocodes?: { main?: { latitude?: number; longitude?: number } };
  tel?: string;
  email?: string;
  website?: string;
  social_media?: Record<string, string>;
  hours?: { display?: string; open_now?: boolean };
  closed_bucket?: string;
  rating?: number;
  stats?: { total_ratings?: number };
};

export async function searchFoursquare(
  slug: string,
  categoryName: string,
  lat: number,
  lon: number,
  radiusKm: number,
  customQuery = "",
): Promise<ProspectResult[]> {
  const key = process.env.FOURSQUARE_API_KEY;
  if (!key) throw new Error("FOURSQUARE_API_KEY is not configured.");

  const query = slug === "custom" ? customQuery : categoryQuery(slug, customQuery, categoryName);

  const url = new URL("https://places-api.foursquare.com/places/search");
  url.searchParams.set("query", query || categoryName);
  url.searchParams.set("ll", `${lat},${lon}`);
  url.searchParams.set("radius", String(Math.min(radiusKm * 1000, 100000)));
  url.searchParams.set("limit", "50");
  url.searchParams.set("sort", "DISTANCE");
  url.searchParams.set(
    "fields",
    "fsq_id,name,distance,categories,location,geocodes,tel,email,website,social_media,hours,closed_bucket,rating,stats",
  );

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

    const socialLinks: Record<string, string> = {};
    if (place.social_media) {
      for (const [k, v] of Object.entries(place.social_media)) {
        if (typeof v === "string" && v) socialLinks[k] = v;
      }
    }

    const openingHours = place.hours?.display ? [place.hours.display] : null;

    return {
      provider: "foursquare",
      providerPlaceId: place.fsq_id ?? `${name}:${latitude}:${longitude}`,
      name,
      formattedAddress: address,
      city: place.location?.locality ?? null,
      regionState: place.location?.region ?? null,
      country: place.location?.country ?? null,
      latitude,
      longitude,
      mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address].filter(Boolean).join(", "))}`,
      providerUrl: place.fsq_id ? `https://foursquare.com/v/${place.fsq_id}` : null,
      phone: place.tel ?? null,
      email: place.email ?? null,
      websiteUrl: place.website ?? null,
      rating: place.rating ?? null,
      reviewCount: place.stats?.total_ratings ?? null,
      types: (place.categories ?? []).map((c) => c.name ?? "").filter(Boolean),
      businessStatus: place.closed_bucket ?? null,
      distanceKm: typeof place.distance === "number" ? place.distance / 1000 : null,
      openingHours,
      socialLinks,
      raw: place as unknown as Record<string, unknown>,
    };
  });
}
