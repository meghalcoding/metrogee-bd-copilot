import "server-only";
import type { ProspectResult, ProspectSearchResult } from "./types";

type GooglePlace = {
  id?: string;
  name?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  googleMapsUri?: string;
  types?: string[];
  businessStatus?: string;
  addressComponents?: Array<{ longText?: string; shortText?: string; types?: string[] }>;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  priceLevel?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string };
};

type GoogleSearchResponse = {
  places?: GooglePlace[];
  nextPageToken?: string;
};

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
  "places.types",
  "places.businessStatus",
  "nextPageToken",
].join(",");

const DETAIL_FIELD_MASK = [
  "id",
  "name",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "location",
  "googleMapsUri",
  "types",
  "primaryType",
  "primaryTypeDisplayName",
  "businessStatus",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "regularOpeningHours",
  "priceLevel",
].join(",");

function apiKey() {
  const key = process.env.GOOGLE_MAPS_PLATFORM_API_KEY;
  if (!key) {
    throw new Error("Prospecting is not configured yet. Add GOOGLE_MAPS_PLATFORM_API_KEY to .env.local.");
  }
  return key;
}

async function googleRequest<T>(url: string, body: Record<string, unknown>, fieldMask: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "Google Places request failed.";
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      detail = payload.error?.message ?? detail;
    } catch {
      // Keep the generic message when Google does not return JSON.
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export async function searchGooglePlaces(query: string, pageToken?: string): Promise<ProspectSearchResult> {
  const payload: Record<string, unknown> = {
    textQuery: query,
    pageSize: 20,
    languageCode: "en",
  };
  if (pageToken) payload.pageToken = pageToken;

  const data = await googleRequest<GoogleSearchResponse>(
    "https://places.googleapis.com/v1/places:searchText",
    payload,
    SEARCH_FIELD_MASK,
  );

  return {
    results: (data.places ?? []).filter((place) => place.id).map((place): ProspectResult => ({
      provider: "google_places",
      providerPlaceId: place.id!,
      name: place.displayName?.text ?? place.name?.replace(/^places\//, "") ?? "Unnamed business",
      formattedAddress: place.formattedAddress ?? null,
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      mapsUrl: place.googleMapsUri ?? null,
      types: place.types ?? [],
      businessStatus: place.businessStatus ?? null,
    })),
    nextPageToken: data.nextPageToken ?? null,
  };
}

export async function getGooglePlaceDetails(placeId: string) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey(),
      "X-Goog-FieldMask": DETAIL_FIELD_MASK,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "Google Places details request failed.";
    try {
      const payload = (await response.json()) as { error?: { message?: string } };
      detail = payload.error?.message ?? detail;
    } catch {
      // Keep the generic message when Google does not return JSON.
    }
    throw new Error(detail);
  }

  return (await response.json()) as GooglePlace;
}
