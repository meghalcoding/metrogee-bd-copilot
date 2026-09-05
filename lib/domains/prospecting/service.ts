import "server-only";
import { createClient } from "@/lib/supabase/server";
import { resolvePostalCode } from "./geocoding";
import { searchOverpass } from "./providers/overpass";
import { searchGeoapify } from "./providers/geoapify";
import { searchFoursquare } from "./providers/foursquare";
import { searchMappls } from "./providers/mappls";
import type {
  AddedProspectResult,
  ProspectResult,
  ProspectSearchInput,
  ProspectSearchResult,
  ProspectingProvider,
} from "./types";

// ─── normalisation helpers ────────────────────────────────────────────────────

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string) {
  // Strip all non-digits, then strip a leading country code only if it results
  // in a plausible local number (7–12 digits). Works for IN (91) and others.
  const digits = value.replace(/\D/g, "");
  if (digits.length > 10) return digits.slice(-10); // keep last 10 for comparison
  return digits;
}

function normalizeUrl(value: string) {
  return value.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
}

// ─── available providers ──────────────────────────────────────────────────────

function availableProviders(countryCode?: string): ProspectingProvider[] {
  const result: ProspectingProvider[] = ["osm_overpass"];
  if (process.env.GEOAPIFY_API_KEY) result.push("geoapify");
  if (process.env.FOURSQUARE_API_KEY) result.push("foursquare");
  // Mappls is India-only
  const isIndia = !countryCode || countryCode.toLowerCase() === "in";
  if (process.env.MAPPLS_ACCESS_TOKEN && isIndia) result.push("mappls");
  return result;
}

// ─── deduplication ───────────────────────────────────────────────────────────

function dedupeResults(results: ProspectResult[]): ProspectResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    const namePart = normalizeName(result.name);
    const phonePart = result.phone ? normalizePhone(result.phone) : "";
    const urlPart = result.websiteUrl ? normalizeUrl(result.websiteUrl) : "";
    const key = [namePart, phonePart, urlPart].filter(Boolean).join("|");
    const fallback = `${namePart}|${result.formattedAddress?.toLowerCase().slice(0, 40) ?? ""}`;
    const identity = key || fallback;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

// ─── provider dispatcher ─────────────────────────────────────────────────────

async function callProvider(
  provider: ProspectingProvider,
  input: ProspectSearchInput,
  categoryName: string,
  location: ProspectSearchResult["location"],
): Promise<ProspectResult[]> {
  const { categorySlug: slug, customQuery = "", radiusKm = 5 } = input;
  const { latitude: lat, longitude: lon } = location;
  switch (provider) {
    case "osm_overpass": return searchOverpass(slug, categoryName, lat, lon, radiusKm, customQuery);
    case "geoapify":     return searchGeoapify(slug, categoryName, lat, lon, radiusKm, customQuery);
    case "foursquare":  return searchFoursquare(slug, categoryName, lat, lon, radiusKm, customQuery);
    case "mappls":       return searchMappls(slug, categoryName, lat, lon, radiusKm, customQuery);
  }
}

// ─── public API ──────────────────────────────────────────────────────────────

export async function searchProspects(
  input: ProspectSearchInput,
  categoryName: string,
): Promise<ProspectSearchResult> {
  const postalCode = input.postalCode.trim();
  const location = await resolvePostalCode(postalCode, input.countryCode);

  const configured = availableProviders(input.countryCode);
  const requested = input.providers?.length ? input.providers : configured;
  const providers = requested.filter((p) => configured.includes(p));
  if (!providers.length) throw new Error("No prospecting providers are configured.");

  const providerErrors: ProspectSearchResult["providerErrors"] = {};
  const batches = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await callProvider(provider, input, categoryName, location);
      } catch (error) {
        providerErrors[provider] = error instanceof Error ? error.message : "Provider search failed.";
        return [];
      }
    }),
  );

  const providerCounts: ProspectSearchResult["providerCounts"] = {};
  providers.forEach((p, i) => { providerCounts[p] = batches[i].length; });

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
  resolvedLocation?: ProspectSearchResult["location"],
): Promise<AddedProspectResult> {
  const supabase = await createClient();
  const normalizedName = normalizeName(result.name);

  // ── Duplicate detection ────────────────────────────────────────────────────
  const { data: existing, error: existingError } = await supabase
    .from("businesses")
    .select("id,name,phone,website_url,postal_code,email")
    .eq("organization_id", organizationId)
    .eq("normalized_name", normalizedName)
    .is("deleted_at", null)
    .limit(20);
  if (existingError) throw existingError;

  const duplicate = (existing ?? []).find((biz) => {
    if (result.phone && biz.phone && normalizePhone(result.phone) === normalizePhone(biz.phone)) return true;
    if (result.websiteUrl && biz.website_url && normalizeUrl(result.websiteUrl) === normalizeUrl(biz.website_url)) return true;
    if (result.email && biz.email && result.email.toLowerCase() === biz.email.toLowerCase()) return true;
    return false;
  });

  if (duplicate) {
    return { status: "EXISTS", businessId: duplicate.id, businessName: duplicate.name, duplicateOf: duplicate.id };
  }

  // ── Extract structured address fields ──────────────────────────────────────
  // Prefer explicit city/state from provider; fall back to resolved geocode location
  const city = result.city ?? resolvedLocation?.city ?? null;
  const regionState = result.regionState ?? resolvedLocation?.state ?? null;
  const country = result.country ?? resolvedLocation?.country ?? null;

  // Try to pull postal code from address string if not on the result
  const postalFromAddress = result.formattedAddress?.match(/\b\d{4,10}\b/)?.[0] ?? null;
  const postalCode = postalFromAddress ?? resolvedLocation?.postalCode ?? null;

  const now = new Date().toISOString();

  // ── Insert business ────────────────────────────────────────────────────────
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      organization_id: organizationId,
      owner_user_id: ownerUserId,
      name: result.name,
      normalized_name: normalizedName,
      address_line_1: result.formattedAddress,
      city,
      state: regionState,
      postal_code: postalCode,
      country: country ?? "Unknown",
      latitude: result.latitude ?? resolvedLocation?.latitude ?? null,
      longitude: result.longitude ?? resolvedLocation?.longitude ?? null,
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
          types: result.types,
          business_status: result.businessStatus,
          opening_hours: result.openingHours,
          social_links: result.socialLinks,
          raw: result.raw,
        },
      },
    })
    .select("id,name")
    .single();
  if (businessError) throw businessError;

  // ── Business sources table ─────────────────────────────────────────────────
  const { error: sourceError } = await supabase.from("business_sources").insert({
    organization_id: organizationId,
    business_id: business.id,
    provider: result.provider,
    provider_place_id: result.providerPlaceId,
    provider_url: result.providerUrl,
    raw_reference: {
      provider: result.provider,
      provider_place_id: result.providerPlaceId,
      raw: result.raw,
    },
  });
  if (sourceError) throw sourceError;

  // ── Automatic note ─────────────────────────────────────────────────────────
  const noteLines = [
    `Imported via Prospecting from ${result.provider}.`,
    result.types.length ? `Types: ${result.types.join(", ")}.` : null,
    result.businessStatus ? `Business status: ${result.businessStatus}.` : null,
    result.rating != null ? `Rating: ${result.rating}.` : null,
    result.reviewCount != null ? `Review count: ${result.reviewCount}.` : null,
    result.openingHours?.length ? `Opening hours: ${result.openingHours.join("; ")}.` : null,
    Object.keys(result.socialLinks).length
      ? `Social: ${Object.entries(result.socialLinks).map(([k, v]) => `${k}: ${v}`).join(", ")}.`
      : null,
    result.mapsUrl ? `Google Maps: ${result.mapsUrl}` : null,
  ].filter(Boolean);

  const { error: noteError } = await supabase.from("notes").insert({
    organization_id: organizationId,
    business_id: business.id,
    author_user_id: ownerUserId,
    body: noteLines.join("\n"),
  });
  if (noteError) throw noteError;

  return { status: "CREATED", businessId: business.id, businessName: business.name };
}
