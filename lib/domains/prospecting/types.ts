export const PROSPECTING_PROVIDERS = [
  "osm_overpass",
  "geoapify",
  "foursquare",
  "mappls",
] as const;

export type ProspectingProvider = (typeof PROSPECTING_PROVIDERS)[number];

export type ProspectSearchInput = {
  /** DB category slug, or "custom" for free-text search */
  categorySlug: string;
  categoryId: string;
  /** Free-text search term — used when categorySlug is "custom" or as fallback */
  customQuery?: string;
  postalCode: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "in", "us", "gb" */
  countryCode?: string;
  radiusKm?: number;
  providers?: ProspectingProvider[];
  page?: number;
};

export type ProspectResult = {
  provider: ProspectingProvider;
  providerPlaceId: string;
  name: string;
  formattedAddress: string | null;
  city: string | null;
  regionState: string | null;
  country: string | null;
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
  openingHours: string[] | null;
  socialLinks: Record<string, string>;
  raw: Record<string, unknown>;
};

export type ProspectingSession = {
  categoryId: string;
  customQuery: string;
  postalCode: string;
  countryCode: string;
  radiusKm: string;
  providers: ProspectingProvider[];
  results: (ProspectResult & { state?: "ADDED" | "EXISTS" | "IGNORED"; businessId?: string })[];
  locationLabel: string;
  providerCounts: Partial<Record<ProspectingProvider, number>>;
  providerErrors: Partial<Record<ProspectingProvider, string>>;
};

export type SavedTerritory = {
  id: string;
  name: string;
  categoryId: string;
  customQuery: string;
  postalCode: string;
  countryCode: string;
  radiusKm: string;
  providers: ProspectingProvider[];
  savedAt: string;
};

export type ProspectSearchResult = {
  results: ProspectResult[];
  nextPage: number | null;
  providersUsed: ProspectingProvider[];
  providerErrors: Partial<Record<ProspectingProvider, string>>;
  providerCounts: Partial<Record<ProspectingProvider, number>>;
  location: {
    postalCode: string;
    city: string | null;
    state: string | null;
    country: string | null;
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
