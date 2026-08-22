import { createClient } from "@/lib/supabase/server";
import type { ActivityInput, ActivityRecord } from "./types";

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInput(input: ActivityInput) {
  const subject = cleanOptional(input.subject);
  const bodyPreview = cleanOptional(input.body_preview);
  if (!subject && !bodyPreview) {
    throw new Error("An activity needs a subject or note.");
  }

  const relatedCount = [
    input.business_id,
    input.lead_id,
    input.contact_id,
    input.opportunity_id,
  ].filter(Boolean).length;

  if (relatedCount === 0) {
    throw new Error("An activity must be related to a business, lead, contact, or opportunity.");
  }

  return {
    business_id: cleanOptional(input.business_id),
    lead_id: cleanOptional(input.lead_id),
    contact_id: cleanOptional(input.contact_id),
    opportunity_id: cleanOptional(input.opportunity_id),
    user_id: cleanOptional(input.user_id),
    type: input.type,
    direction: input.direction ?? null,
    subject,
    body_preview: bodyPreview,
    occurred_at: input.occurred_at || new Date().toISOString(),
    provider: cleanOptional(input.provider),
    provider_event_id: cleanOptional(input.provider_event_id),
    metadata_json: input.metadata_json ?? {},
  };
}

export async function listActivities(organizationId: string, filters?: {
  businessId?: string;
  leadId?: string;
  contactId?: string;
  opportunityId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("activities")
    .select("*")
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false });

  if (filters?.businessId) query = query.eq("business_id", filters.businessId);
  if (filters?.leadId) query = query.eq("lead_id", filters.leadId);
  if (filters?.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters?.opportunityId) query = query.eq("opportunity_id", filters.opportunityId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ActivityRecord[];
}

export async function createActivity(organizationId: string, input: ActivityInput) {
  const supabase = await createClient();
  const normalized = normalizeInput(input);

  const { data, error } = await supabase
    .from("activities")
    .insert({ ...normalized, organization_id: organizationId })
    .select("*")
    .single();

  if (error) throw error;
  return data as ActivityRecord;
}
