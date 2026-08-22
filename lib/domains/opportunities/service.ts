import { createClient } from "@/lib/supabase/server";
import type { OpportunityInput, OpportunityStage } from "./types";

const ALLOWED_TRANSITIONS: Record<OpportunityStage, OpportunityStage[]> = {
  QUALIFIED: ["CONTACTED"],
  CONTACTED: ["CONNECTED"],
  CONNECTED: ["INTERESTED"],
  INTERESTED: ["DEMO"],
  DEMO: ["PROPOSAL"],
  PROPOSAL: ["NEGOTIATION"],
  NEGOTIATION: [],
};

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function assertOpportunityStageTransition(from: OpportunityStage, to: OpportunityStage) {
  if (from === to) return;
  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`Opportunity cannot move directly from ${from} to ${to}.`);
  }
}

function normalizeInput(input: OpportunityInput) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 200) throw new Error("Opportunity name must be between 1 and 200 characters.");
  if (input.value_amount != null && input.value_amount < 0) throw new Error("Opportunity value cannot be negative.");
  if (input.probability != null && (input.probability < 0 || input.probability > 100)) throw new Error("Probability must be between 0 and 100.");

  return {
    lead_id: input.lead_id,
    name,
    value_amount: input.value_amount ?? null,
    currency: (input.currency ?? "USD").trim().toUpperCase() || "USD",
    probability: input.probability ?? null,
    expected_close_date: input.expected_close_date || null,
    stage: input.stage ?? "QUALIFIED",
    status: input.status ?? "OPEN",
    owner_user_id: cleanOptional(input.owner_user_id),
  };
}

export async function listOpportunities(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*, lead:leads!opportunities_lead_id_organization_id_fkey(id,stage,business:businesses!leads_business_id_organization_id_fkey(name))")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listLeadOpportunities(organizationId: string, leadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getOpportunity(organizationId: string, opportunityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*, lead:leads!opportunities_lead_id_organization_id_fkey(id,stage,business:businesses!leads_business_id_organization_id_fkey(id,name),primary_contact:contacts!leads_primary_contact_id_organization_id_fkey(id,full_name,email,phone))")
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createOpportunity(organizationId: string, input: OpportunityInput) {
  if (!input.lead_id) throw new Error("A lead is required to create an opportunity.");
  const supabase = await createClient();
  const normalized = normalizeInput(input);

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,stage,deleted_at")
    .eq("organization_id", organizationId)
    .eq("id", input.lead_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (leadError) throw leadError;
  if (!lead) throw new Error("Lead not found.");
  if (!["QUALIFIED", "CONTACTED", "CONNECTED", "INTERESTED", "DEMO", "PROPOSAL", "NEGOTIATION"].includes(lead.stage)) {
    throw new Error("The lead must be in an active sales stage before creating an opportunity.");
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({ ...normalized, organization_id: organizationId })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateOpportunity(organizationId: string, opportunityId: string, input: OpportunityInput) {
  const supabase = await createClient();
  const current = await getOpportunity(organizationId, opportunityId);
  if (!current) throw new Error("Opportunity not found.");

  const normalized = normalizeInput(input);
  assertOpportunityStageTransition(current.stage as OpportunityStage, normalized.stage as OpportunityStage);

  if (normalized.status === "OPEN" && current.status !== "OPEN") {
    throw new Error("A closed opportunity cannot be reopened in P1-G.");
  }

  const closed = normalized.status !== "OPEN";
  const { data, error } = await supabase
    .from("opportunities")
    .update({ ...normalized, closed_at: closed ? current.closed_at ?? new Date().toISOString() : null })
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
