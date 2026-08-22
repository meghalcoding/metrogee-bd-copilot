import { createClient } from "@/lib/supabase/server";
import type { LeadInput, LeadListItem, LeadStage, LeadStatus } from "./types";

const ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  NEW: ["QUALIFYING", "NURTURE"],
  QUALIFYING: ["QUALIFIED", "NURTURE"],
  QUALIFIED: ["CONTACTED", "NURTURE"],
  CONTACTED: ["CONNECTED", "NURTURE"],
  CONNECTED: ["INTERESTED", "NURTURE"],
  INTERESTED: ["DEMO", "NURTURE"],
  DEMO: ["PROPOSAL", "NURTURE"],
  PROPOSAL: ["NEGOTIATION", "WON", "LOST", "NURTURE"],
  NEGOTIATION: ["WON", "LOST", "NURTURE"],
  WON: [],
  LOST: [],
  NURTURE: ["QUALIFYING", "LOST"],
};

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function validateScore(value: number | null | undefined, label: string) {
  if (value != null && (value < 0 || value > 100)) {
    throw new Error(`${label} must be between 0 and 100.`);
  }
}

function normalizeInput(input: LeadInput) {
  validateScore(input.opportunity_score, "Opportunity score");
  validateScore(input.priority_score, "Priority score");

  return {
    business_id: input.business_id,
    primary_contact_id: cleanOptional(input.primary_contact_id),
    owner_user_id: cleanOptional(input.owner_user_id),
    stage: input.stage ?? "NEW",
    status: input.status ?? "ACTIVE",
    source: cleanOptional(input.source),
    qualification_status: input.qualification_status ?? "UNQUALIFIED",
    opportunity_score: input.opportunity_score ?? null,
    priority_score: input.priority_score ?? null,
    next_action_at: input.next_action_at || null,
    lost_reason: cleanOptional(input.lost_reason),
  };
}

export function assertLeadStageTransition(from: LeadStage, to: LeadStage) {
  if (from === to) return;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Lead cannot move directly from ${from} to ${to}.`);
  }
}

export async function listLeads(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, business:businesses!leads_business_id_organization_id_fkey(name), primary_contact:contacts!leads_primary_contact_id_organization_id_fkey(full_name)")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("priority_score", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeadListItem[];
}

export async function getLead(organizationId: string, leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, business:businesses!leads_business_id_organization_id_fkey(id,name,website_url,website_status), primary_contact:contacts!leads_primary_contact_id_organization_id_fkey(id,full_name,job_title,email,phone)")
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createLead(organizationId: string, input: LeadInput) {
  if (!input.business_id) throw new Error("A business is required to create a lead.");
  const supabase = await createClient();
  const normalized = normalizeInput(input);

  const { data: existing } = await supabase
  .from("leads")
  .select("id")
  .eq("organization_id", organizationId)
  .eq("business_id", input.business_id)
  .in("status", ["ACTIVE", "PAUSED", "ON_HOLD"])
  .is("deleted_at", null)
  .limit(1)
  .maybeSingle();

if (existing) {
  throw new Error("This business already has an active lead in this organization.");
}

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...normalized, organization_id: organizationId })
    .select("*")
    .single();

  if (error) throw error;

  const { error: historyError } = await supabase.from("lead_stage_history").insert({
    organization_id: organizationId,
    lead_id: data.id,
    from_stage: null,
    to_stage: "NEW",
    reason: "Lead created",
  });
  if (historyError) throw historyError;

  return data;
}

export async function updateLead(organizationId: string, leadId: string, input: LeadInput) {
  const supabase = await createClient();
  const current = await getLead(organizationId, leadId);
  if (!current) throw new Error("Lead not found.");

  const normalized = normalizeInput(input);
  assertLeadStageTransition(current.stage as LeadStage, normalized.stage as LeadStage);

  const nextStage = normalized.stage as LeadStage;
  if (nextStage === "LOST" && !normalized.lost_reason) {
    throw new Error("A lost reason is required when moving a lead to LOST.");
  }

  const { data, error } = await supabase
    .from("leads")
    .update({
      ...normalized,
      converted_at: nextStage === "WON" ? new Date().toISOString() : current.converted_at,
    })
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error) throw error;

  if (current.stage !== nextStage) {
    const { error: historyError } = await supabase.from("lead_stage_history").insert({
      organization_id: organizationId,
      lead_id: leadId,
      from_stage: current.stage,
      to_stage: nextStage,
      reason: normalized.lost_reason ?? null,
    });
    if (historyError) throw historyError;
  }

  return data;
}

export async function archiveLead(organizationId: string, leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString(), status: "ARCHIVED" as LeadStatus })
    .eq("organization_id", organizationId)
    .eq("id", leadId)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function listLeadStageHistory(organizationId: string, leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_stage_history")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
