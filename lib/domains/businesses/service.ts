import { createClient } from "@/lib/supabase/server";
import type { BusinessInput, BusinessListFilters } from "./types";

function normalizeBusinessName(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeBusinessInput(input: BusinessInput) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 200) {
    throw new Error("Business name must be between 1 and 200 characters.");
  }

  if (input.website_url) {
    try {
      new URL(input.website_url);
    } catch {
      throw new Error("Website URL is invalid.");
    }
  }

  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new Error("Business email is invalid.");
  }

  if (input.rating != null && (input.rating < 0 || input.rating > 5)) {
    throw new Error("Rating must be between 0 and 5.");
  }

  if (input.review_count != null && (!Number.isInteger(input.review_count) || input.review_count < 0)) {
    throw new Error("Review count must be a non-negative integer.");
  }

  return {
    ...input,
    name,
    normalized_name: normalizeBusinessName(name),
    legal_name: cleanOptional(input.legal_name),
    address_line_1: cleanOptional(input.address_line_1),
    address_line_2: cleanOptional(input.address_line_2),
    city: cleanOptional(input.city),
    state: cleanOptional(input.state),
    postal_code: cleanOptional(input.postal_code),
    country: cleanOptional(input.country) ?? "India",
    phone: cleanOptional(input.phone),
    email: cleanOptional(input.email)?.toLowerCase() ?? null,
    website_url: cleanOptional(input.website_url),
    source_primary: cleanOptional(input.source_primary),
  };
}

export async function listBusinesses(organizationId: string, filters: BusinessListFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("businesses")
    .select("id,organization_id,name,legal_name,city,state,country,postal_code,phone,email,website_url,website_status,primary_category_id,rating,review_count,owner_user_id,source_primary,source_last_synced_at,metadata_json,created_at,updated_at")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (filters.search?.trim()) {
    const search = filters.search.trim().replace(/,/g, " ");
    query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (filters.website_status) query = query.eq("website_status", filters.website_status);
  if (filters.category_id) query = query.eq("primary_category_id", filters.category_id);
  if (filters.city?.trim()) query = query.ilike("city", filters.city.trim());

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}


export async function listBusinessCategories(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("business_categories")
    .select("id,name,slug,is_system,is_active")
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getBusiness(organizationId: string, businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", businessId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createBusiness(organizationId: string, ownerUserId: string, input: BusinessInput) {
  const supabase = await createClient();
  const normalized = normalizeBusinessInput(input);

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      ...normalized,
      organization_id: organizationId,
      owner_user_id: ownerUserId,
      website_status: input.website_status ?? "WU",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateBusiness(organizationId: string, businessId: string, input: BusinessInput) {
  const supabase = await createClient();
  const normalized = normalizeBusinessInput(input);

  const { data, error } = await supabase
    .from("businesses")
    .update(normalized)
    .eq("organization_id", organizationId)
    .eq("id", businessId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function archiveBusiness(organizationId: string, businessId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", businessId)
    .is("deleted_at", null);

  if (error) throw error;
}
