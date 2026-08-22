export const PROSPECTING_PROVIDERS = [
  "osm_overpass",
  "geoapify",
  "foursquare",
  "mappls",
] as const;

export type ProspectingProvider = (typeof PROSPECTING_PROVIDERS)[number];

export type ProspectSearchInput = {
  categorySlug: string;
  categoryId: string;
  postalCode: string;
  radiusKm?: number;
  providers?: ProspectingProvider[];
  page?: number;
};

export type ProspectResult = {
  provider: ProspectingProvider;
  providerPlaceId: string;
  name: string;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  providerUrl: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
  types: string[];
  businessStatus: string | null;
  distanceKm: number | null;
  raw: Record<string, unknown>;
};

export type ProspectSearchResult = {
  results: ProspectResult[];
  nextPage: number | null;
  providersUsed: ProspectingProvider[];
  providerErrors: Partial<Record<ProspectingProvider, string>>;
  location: {
    postalCode: string;
    city: string | null;
    state: string | null;
    latitude: number;
    longitude: number;
  };
};

export type AddedProspectResult = {
  status: "CREATED" | "EXISTS";
  businessId: string;
  businessName: string;
  duplicateOf?: string;
};
