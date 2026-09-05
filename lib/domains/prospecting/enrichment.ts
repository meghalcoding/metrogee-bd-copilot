import "server-only";

import { createClient } from "@/lib/supabase/server";
import { listBusinessCategories } from "@/lib/domains/businesses/service";
import { resolvePostalCode } from "./geocoding";
import { searchOverpass } from "./providers/overpass";
import { searchGeoapify } from "./providers/geoapify";
import { searchFoursquare } from "./providers/foursquare";
import { searchMappls } from "./providers/mappls";
import type { ProspectResult, ProspectingProvider, ProspectSearchInput } from "./types";

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeUrl(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function configuredProviders(countryCode?: string | null): ProspectingProvider[] {
  const providers: ProspectingProvider[] = ["osm_overpass"];
  if (process.env.GEOAPIFY_API_KEY) providers.push("geoapify");
  if (process.env.FOURSQUARE_API_KEY) providers.push("foursquare");
  const isIndia = !countryCode || countryCode.toLowerCase() === "in";
  if (process.env.MAPPLS_ACCESS_TOKEN && isIndia) providers.push("mappls");
  return providers;
}

function searchProvider(
  provider: ProspectingProvider,
  input: ProspectSearchInput,
  categoryName: string,
  lat: number,
  lon: number,
) {
  const radiusKm = input.radiusKm ?? 5;
  const customQuery = input.customQuery ?? "";
  switch (provider) {
    case "osm_overpass": return searchOverpass(input.categorySlug, categoryName, lat, lon, radiusKm, customQuery);
    case "geoapify":     return searchGeoapify(input.categorySlug, categoryName, lat, lon, radiusKm, customQuery);
    case "foursquare":  return searchFoursquare(input.categorySlug, categoryName, lat, lon, radiusKm, customQuery);
    case "mappls":       return searchMappls(input.categorySlug, categoryName, lat, lon, radiusKm, customQuery);
  }
}

function scoreMatch(
  business: { name: string; phone: string | null; website_url: string | null; address_line_1: string | null },
  result: ProspectResult,
) {
  let score = 0;
  if (normalizeName(business.name) === normalizeName(result.name)) score += 60;
  else if (
    normalizeName(business.name).includes(normalizeName(result.name)) ||
    normalizeName(result.name).includes(normalizeName(business.name))
  ) score += 35;
  if (business.phone && result.phone && normalizePhone(business.phone) === normalizePhone(result.phone)) score += 30;
  if (business.website_url && result.websiteUrl && normalizeUrl(business.website_url) === normalizeUrl(result.websiteUrl)) score += 30;
  if (business.address_line_1 && result.formattedAddress) {
    const a = business.address_line_1.toLocaleLowerCase();
    const b = result.formattedAddress.toLocaleLowerCase();
    if (a.includes(b) || b.includes(a)) score += 10;
  }
  return score;
}

function chooseMatch(
  business: { name: string; phone: string | null; website_url: string | null; address_line_1: string | null },
  results: ProspectResult[],
) {
  let best: ProspectResult | null = null;
  let bestScore = 0;
  for (const result of results) {
    const s = scoreMatch(business, result);
    if (s > bestScore) { best = result; bestScore = s; }
  }
  return best && bestScore >= 35 ? { result: best, score: bestScore } : null;
}

export type BusinessEnrichmentResult = {
  businessId: string;
  businessName: string;
  providersUsed: ProspectingProvider[];
  matchedProviders: ProspectingProvider[];
  providerErrors: Partial<Record<ProspectingProvider, string>>;
  fieldsUpdated: string[];
};

export async function enrichBusiness(
  organizationId: string,
  ownerUserId: string,
  businessId: string,
): Promise<BusinessEnrichmentResult> {
  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select(
      "id,name,address_line_1,city,state,postal_code,country,latitude,longitude,phone,email,website_url,website_status,rating,review_count,primary_category_id,source_primary,metadata_json",
    )
    .eq("organization_id", organizationId)
    .eq("id", businessId)
    .is("deleted_at", null)
    .single();
  if (businessError) throw businessError;

  const categories = await listBusinessCategories(organizationId);
  const category = categories.find((item) => item.id === business.primary_category_id);
  if (!category) throw new Error("This business has no category available for enrichment.");

  let latitude = business.latitude as number | null;
  let longitude = business.longitude as number | null;
  if (latitude == null || longitude == null) {
    if (!business.postal_code) throw new Error("This business has no coordinates or postal code for enrichment.");
    const countryCode = typeof business.country === "string"
      ? business.country.slice(0, 2).toLowerCase()
      : undefined;
    const location = await resolvePostalCode(business.postal_code, countryCode);
    latitude = location.latitude;
    longitude = location.longitude;
  }

  const countryCode = typeof business.country === "string"
    ? business.country.slice(0, 2).toLowerCase()
    : undefined;
  const providers = configuredProviders(countryCode);

  const providerErrors: Partial<Record<ProspectingProvider, string>> = {};
  const matched: Array<{ provider: ProspectingProvider; result: ProspectResult; matchScore: number }> = [];
  const input: ProspectSearchInput = {
    categorySlug: category.slug,
    categoryId: category.id,
    postalCode: business.postal_code ?? "",
    countryCode,
    radiusKm: 2,
    providers,
  };

  await Promise.all(
    providers.map(async (provider) => {
      try {
        const results = await searchProvider(provider, input, category.name, latitude!, longitude!);
        const match = chooseMatch(business, results);
        if (match) matched.push({ provider, result: match.result, matchScore: match.score });
      } catch (error) {
        providerErrors[provider] = error instanceof Error ? error.message : "Provider enrichment failed.";
      }
    }),
  );

  const update: Record<string, unknown> = {};
  const fieldsUpdated: string[] = [];
  const provenance: Record<string, { provider: ProspectingProvider; matchScore: number }> = {};
  const conflicts: Array<{ field: string; provider: ProspectingProvider; existing: unknown; candidate: unknown }> = [];

  const setIfMissing = (field: string, value: unknown, label: string) => {
    if ((business as Record<string, unknown>)[field] == null && value != null) {
      update[field] = value;
      fieldsUpdated.push(label);
    }
  };

  setIfMissing("latitude", latitude, "coordinates");
  setIfMissing("longitude", longitude, "coordinates");

  const enrichFields: Array<[string, keyof ProspectResult, string]> = [
    ["address_line_1", "formattedAddress", "address"],
    ["city", "city", "city"],
    ["state", "regionState", "state"],
    ["country", "country", "country"],
    ["phone", "phone", "phone"],
    ["email", "email", "email"],
    ["website_url", "websiteUrl", "website"],
    ["rating", "rating", "rating"],
    ["review_count", "reviewCount", "review count"],
  ];

  for (const match of matched) {
    for (const [field, key, label] of enrichFields) {
      const candidate = match.result[key];
      const existing = (business as Record<string, unknown>)[field];
      if (existing == null && candidate != null) {
        setIfMissing(field, candidate, label);
        provenance[field] = { provider: match.provider, matchScore: match.matchScore };
      } else if (existing != null && candidate != null && String(existing) !== String(candidate)) {
        conflicts.push({ field, provider: match.provider, existing, candidate });
      }
    }
  }

  if (update.website_url) update.website_status = "WU";
  if (Object.keys(update).length) {
    update.source_last_synced_at = new Date().toISOString();
    const { error } = await supabase
      .from("businesses")
      .update(update)
      .eq("organization_id", organizationId)
      .eq("id", businessId);
    if (error) throw error;
  }

  // Persist enrichment metadata
  const metadata = (business.metadata_json ?? {}) as Record<string, unknown>;
  const enrichment = {
    ...(metadata.enrichment as Record<string, unknown> | undefined),
    last_run_at: new Date().toISOString(),
    providers: matched.map(({ provider, result, matchScore }) => ({
      provider,
      provider_place_id: result.providerPlaceId,
      provider_url: result.providerUrl,
      match_score: matchScore,
      opening_hours: result.openingHours,
      social_links: result.socialLinks,
    })),
    provider_errors: providerErrors,
    field_provenance: provenance,
    conflicts,
  };
  await supabase
    .from("businesses")
    .update({ metadata_json: { ...metadata, enrichment } })
    .eq("organization_id", organizationId)
    .eq("id", businessId);

  // Upsert business_sources
  for (const { provider, result } of matched) {
    const { data: source } = await supabase
      .from("business_sources")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("provider", provider)
      .eq("provider_place_id", result.providerPlaceId)
      .maybeSingle();
    if (source?.id) {
      await supabase
        .from("business_sources")
        .update({
          business_id: businessId,
          provider_url: result.providerUrl,
          raw_reference: { provider, provider_place_id: result.providerPlaceId, raw: result.raw },
          last_seen_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId)
        .eq("id", source.id);
    } else {
      await supabase.from("business_sources").insert({
        organization_id: organizationId,
        business_id: businessId,
        provider,
        provider_place_id: result.providerPlaceId,
        provider_url: result.providerUrl,
        raw_reference: { provider, provider_place_id: result.providerPlaceId, raw: result.raw },
      });
    }
  }

  // Enrichment note
  if (matched.length || Object.keys(providerErrors).length) {
    const lines = [
      `Enrichment run: ${new Date().toLocaleString()}`,
      matched.length
        ? `Matched providers: ${matched.map((m) => m.provider).join(", ")}.`
        : "No provider produced a confident match.",
      fieldsUpdated.length
        ? `Fields filled: ${fieldsUpdated.join(", ")}.`
        : "No empty fields were filled.",
      ...Object.entries(providerErrors).map(([p, m]) => `${p}: ${m}`),
    ];
    await supabase.from("notes").insert({
      organization_id: organizationId,
      business_id: businessId,
      author_user_id: ownerUserId,
      body: lines.join("\n"),
    });
  }

  return {
    businessId,
    businessName: business.name,
    providersUsed: providers,
    matchedProviders: matched.map((m) => m.provider),
    providerErrors,
    fieldsUpdated,
  };
}
