import { createClient } from "@/lib/supabase/server";
import type { ContactInput } from "./types";

function optional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeContactInput(input: ContactInput) {
  const fullName = input.full_name.trim();
  if (fullName.length < 1 || fullName.length > 200) {
    throw new Error("Contact name must be between 1 and 200 characters.");
  }

  const email = optional(input.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Contact email is invalid.");
  }

  return {
    first_name: optional(input.first_name),
    last_name: optional(input.last_name),
    full_name: fullName,
    job_title: optional(input.job_title),
    phone: optional(input.phone),
    email: email?.toLowerCase() ?? null,
    whatsapp_phone: optional(input.whatsapp_phone),
    preferred_channel: input.preferred_channel ?? null,
    source: optional(input.source),
  };
}

export async function listContacts(organizationId: string, businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getContact(organizationId: string, contactId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", contactId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createContact(organizationId: string, businessId: string, input: ContactInput) {
  const supabase = await createClient();
  const normalized = normalizeContactInput(input);

  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...normalized, organization_id: organizationId, business_id: businessId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateContact(organizationId: string, contactId: string, input: ContactInput) {
  const supabase = await createClient();
  const normalized = normalizeContactInput(input);

  const { data, error } = await supabase
    .from("contacts")
    .update(normalized)
    .eq("organization_id", organizationId)
    .eq("id", contactId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function archiveContact(organizationId: string, contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("organization_id", organizationId)
    .eq("id", contactId)
    .is("deleted_at", null);

  if (error) throw error;
}
