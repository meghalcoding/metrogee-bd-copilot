import { createClient } from "@/lib/supabase/server";
import type { MeetingInput, MeetingListItem, MeetingRecord, MeetingStatus } from "./types";

function optional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeInput(input: MeetingInput) {
  const title = input.title.trim();
  if (!title) throw new Error("Meeting title is required.");
  if (title.length > 240) throw new Error("Meeting title is too long.");

  const start = new Date(input.start_at);
  const end = new Date(input.end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Meeting date and time are invalid.");
  }
  if (end <= start) throw new Error("Meeting end time must be after the start time.");

  const related = [input.business_id, input.lead_id, input.contact_id, input.opportunity_id].filter(Boolean);
  if (!related.length) throw new Error("A meeting must be related to a business, lead, contact, or opportunity.");

  return {
    business_id: optional(input.business_id),
    lead_id: optional(input.lead_id),
    contact_id: optional(input.contact_id),
    opportunity_id: optional(input.opportunity_id),
    title,
    description: optional(input.description),
    location: optional(input.location),
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    timezone: optional(input.timezone) ?? "Asia/Kolkata",
  };
}

const LIST_SELECT = `
  *,
  business:businesses(id,name),
  lead:leads(id,stage,business:businesses(name)),
  contact:contacts(id,full_name,email),
  opportunity:opportunities(id,name,stage,status)
`;

export async function listMeetings(organizationId: string, options?: { status?: MeetingStatus; upcomingOnly?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from("meetings")
    .select(LIST_SELECT)
    .eq("organization_id", organizationId)
    .order("start_at", { ascending: true });

  if (options?.status) query = query.eq("status", options.status);
  if (options?.upcomingOnly) query = query.gte("start_at", new Date().toISOString()).in("status", ["SCHEDULED"]);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MeetingListItem[];
}

export async function listRelatedMeetings(organizationId: string, filters: { businessId?: string; leadId?: string; contactId?: string; opportunityId?: string }) {
  const supabase = await createClient();
  let query = supabase.from("meetings").select(LIST_SELECT).eq("organization_id", organizationId).order("start_at", { ascending: true });
  if (filters.businessId) query = query.eq("business_id", filters.businessId);
  if (filters.leadId) query = query.eq("lead_id", filters.leadId);
  if (filters.contactId) query = query.eq("contact_id", filters.contactId);
  if (filters.opportunityId) query = query.eq("opportunity_id", filters.opportunityId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MeetingListItem[];
}

export async function getMeeting(organizationId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("meetings").select(LIST_SELECT).eq("organization_id", organizationId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as MeetingListItem | null;
}

export async function createMeeting(organizationId: string, userId: string, input: MeetingInput) {
  const supabase = await createClient();
  const normalized = normalizeInput(input);

  if (normalized.business_id && normalized.lead_id) {
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("business_id")
      .eq("organization_id", organizationId)
      .eq("id", normalized.lead_id)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead) throw new Error("Selected lead was not found.");
    if (lead.business_id !== normalized.business_id) throw new Error("Selected lead does not belong to the selected business.");
  }

  if (normalized.lead_id && normalized.opportunity_id) {
    const { data: opportunity, error: opportunityError } = await supabase
      .from("opportunities")
      .select("lead_id")
      .eq("organization_id", organizationId)
      .eq("id", normalized.opportunity_id)
      .maybeSingle();
    if (opportunityError) throw opportunityError;
    if (!opportunity) throw new Error("Selected opportunity was not found.");
    if (opportunity.lead_id !== normalized.lead_id) throw new Error("Selected opportunity does not belong to the selected lead.");
  }

  if (normalized.business_id && normalized.contact_id) {
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("business_id")
      .eq("organization_id", organizationId)
      .eq("id", normalized.contact_id)
      .maybeSingle();
    if (contactError) throw contactError;
    if (!contact) throw new Error("Selected contact was not found.");
    if (contact.business_id !== normalized.business_id) throw new Error("Selected contact does not belong to the selected business.");
  }

  const { data, error } = await supabase.from("meetings").insert({
    ...normalized,
    organization_id: organizationId,
    created_by: userId,
    provider: "CRM_ICS",
    status: "SCHEDULED",
  }).select("*").single();
  if (error) throw error;
  return data as MeetingRecord;
}

export async function updateMeetingStatus(organizationId: string, id: string, status: MeetingStatus) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("meetings").update({ status }).eq("organization_id", organizationId).eq("id", id).select("*").single();
  if (error) throw error;
  return data as MeetingRecord;
}
