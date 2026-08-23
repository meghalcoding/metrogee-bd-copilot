import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolveIndianPin } from "./india";
import { searchOverpass } from "./providers/overpass";
import { searchGeoapify } from "./providers/geoapify";
import { searchFoursquare } from "./providers/foursquare";
import { searchMappls } from "./providers/mappls";
import type { AddedProspectResult, ProspectResult, ProspectSearchInput, ProspectSearchResult, ProspectingProvider } from "./types";

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^91/, "");
}

function normalizeUrl(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

function availableProviders(): ProspectingProvider[] {
  const result: ProspectingProvider[] = ["osm_overpass"];
  if (process.env.GEOAPIFY_API_KEY) result.push("geoapify");
  if (process.env.FOURSQUARE_API_KEY) result.push("foursquare");
  if (process.env.MAPPLS_ACCESS_TOKEN) result.push("mappls");
  return result;
}

function dedupeResults(results: ProspectResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = [normalizeName(result.name), normalizePhone(result.phone ?? ""), normalizeUrl(result.websiteUrl ?? "")].filter(Boolean).join("|");
    const fallback = `${normalizeName(result.name)}|${result.formattedAddress?.toLowerCase() ?? ""}`;
    const identity = key || fallback;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

async function searchProvider(provider: ProspectingProvider, input: ProspectSearchInput, categoryName: string, location: ProspectSearchResult["location"]) {
  switch (provider) {
    case "osm_overpass":
      return searchOverpass(input.categorySlug, categoryName, location.latitude, location.longitude, input.radiusKm ?? 5);
    case "geoapify":
      return searchGeoapify(input.categorySlug, categoryName, location.latitude, location.longitude, input.radiusKm ?? 5);
    case "foursquare":
      return searchFoursquare(input.categorySlug, categoryName, location.latitude, location.longitude, input.radiusKm ?? 5);
    case "mappls":
      return searchMappls(input.categorySlug, categoryName, location.latitude, location.longitude, input.radiusKm ?? 5);
  }
}

export async function searchProspects(input: ProspectSearchInput, categoryName: string): Promise<ProspectSearchResult> {
  const postalCode = input.postalCode.trim();
  const location = await resolveIndianPin(postalCode);
  const configured = availableProviders();
  const requested = input.providers?.length ? input.providers : configured;
  const providers = requested.filter((provider) => configured.includes(provider));
  if (!providers.length) throw new Error("No prospecting providers are configured.");

  const providerErrors: ProspectSearchResult["providerErrors"] = {};
  const batches = await Promise.all(providers.map(async (provider) => {
    try {
      return await searchProvider(provider, input, categoryName, location);
    } catch (error) {
      providerErrors[provider] = error instanceof Error ? error.message : "Provider search failed.";
      return [];
    }
  }));

  const providerCounts: ProspectSearchResult["providerCounts"] = {};
  providers.forEach((provider, index) => { providerCounts[provider] = batches[index].length; });
  const results = dedupeResults(batches.flat());
  return {
    results,
    nextPage: null,
    providersUsed: providers,
    providerErrors,
    providerCounts,
    location,
  };
}

export async function addProspect(
  organizationId: string,
  ownerUserId: string,
  categoryId: string,
  categoryName: string,
  result: ProspectResult,
): Promise<AddedProspectResult> {
  const supabase = await createClient();
  const normalizedName = normalizeName(result.name);
  const postalCode = result.formattedAddress?.match(/\b\d{6}\b/)?.[0] ?? null;

  const { data: existing, error: existingError } = await supabase
    .from("businesses")
    .select("id,name,phone,website_url,postal_code")
    .eq("organization_id", organizationId)
    .eq("normalized_name", normalizedName)
    .is("deleted_at", null)
    .limit(20);
  if (existingError) throw existingError;

  const duplicate = (existing ?? []).find((business) => {
    if (result.phone && business.phone && normalizePhone(result.phone) === normalizePhone(business.phone)) return true;
    if (result.websiteUrl && business.website_url && normalizeUrl(result.websiteUrl) === normalizeUrl(business.website_url)) return true;
    if (postalCode && business.postal_code && postalCode === business.postal_code) return true;
    return false;
  });

  if (duplicate) {
    return { status: "EXISTS", businessId: duplicate.id, businessName: duplicate.name, duplicateOf: duplicate.id };
  }

  const now = new Date().toISOString();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      organization_id: organizationId,
      owner_user_id: ownerUserId,
      name: result.name,
      normalized_name: normalizedName,
      address_line_1: result.formattedAddress,
      city: null,
      state: null,
      postal_code: postalCode,
      country: "India",
      latitude: result.latitude,
      longitude: result.longitude,
      phone: result.phone,
      email: result.email,
      website_url: result.websiteUrl,
      website_status: result.websiteUrl ? "WU" : "W0",
      primary_category_id: categoryId,
      rating: result.rating,
      review_count: result.reviewCount,
      source_primary: result.provider,
      source_last_synced_at: now,
      metadata_json: {
        prospecting: {
          provider: result.provider,
          provider_place_id: result.providerPlaceId,
          category_id: categoryId,
          category_name: categoryName,
          imported_at: now,
          provider_url: result.providerUrl,
          google_maps_url: result.mapsUrl,
          raw: result.raw,
        },
      },
    })
    .select("id,name")
    .single();
  if (businessError) throw businessError;

  const { error: sourceError } = await supabase.from("business_sources").insert({
    organization_id: organizationId,
    business_id: business.id,
    provider: result.provider,
    provider_place_id: result.providerPlaceId,
    provider_url: result.providerUrl,
    raw_reference: { provider: result.provider, provider_place_id: result.providerPlaceId, raw: result.raw },
  });
  if (sourceError) throw sourceError;

  const unknown = [
    `Imported from ${result.provider}.`,
    result.types.length ? `Categories/types: ${result.types.join(", ")}` : null,
    result.businessStatus ? `Status: ${result.businessStatus}` : null,
    result.rating != null ? `Rating: ${result.rating}` : null,
    result.reviewCount != null ? `Review count: ${result.reviewCount}` : null,
    result.mapsUrl ? `Google Maps reference: ${result.mapsUrl}` : null,
  ].filter(Boolean).join("\n");

  const { error: noteError } = await supabase.from("notes").insert({
    organization_id: organizationId,
    business_id: business.id,
    author_user_id: ownerUserId,
    body: unknown,
  });
  if (noteError) throw noteError;

  return { status: "CREATED", businessId: business.id, businessName: business.name };
}
