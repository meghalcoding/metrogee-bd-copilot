import { createClient } from "@/lib/supabase/server";
import type { OpportunityInput, OpportunityStage, OpportunityStatus } from "./types";

const OPPORTUNITY_STAGE_SET = new Set<OpportunityStage>([
  "DISCOVERY",
  "SOLUTIONING",
  "PROPOSAL",
  "NEGOTIATION",
  "CONTRACTING",
  "DELIVERY",
]);

function cleanOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function assertOpportunityStageTransition(from: OpportunityStage, to: OpportunityStage) {
  if (from === to) return;
  if (!OPPORTUNITY_STAGE_SET.has(from) || !OPPORTUNITY_STAGE_SET.has(to)) {
    throw new Error(`Unsupported opportunity stage change: ${from} → ${to}.`);
  }
}

function normalizeInput(input: OpportunityInput) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 200) throw new Error("Opportunity name must be between 1 and 200 characters.");
  if (input.value_amount != null && input.value_amount < 0) throw new Error("Opportunity value cannot be negative.");
  if (input.probability != null && (input.probability < 0 || input.probability > 100)) throw new Error("Probability must be between 0 and 100.");

  const status = input.status ?? "OPEN";
  const lostReason = cleanOptional(input.lost_reason);
  if (status === "LOST" && !lostReason) throw new Error("A lost reason is required when closing an opportunity as LOST.");

  return {
    lead_id: input.lead_id,
    name,
    value_amount: input.value_amount ?? null,
    currency: (input.currency ?? "USD").trim().toUpperCase() || "USD",
    probability: input.probability ?? null,
    expected_close_date: input.expected_close_date || null,
    stage: input.stage ?? "DISCOVERY",
    status,
    owner_user_id: cleanOptional(input.owner_user_id),
    lost_reason: lostReason,
  };
}

export async function listOpportunities(organizationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunities")
    .select("*, lead:leads!opportunities_lead_id_organization_id_fkey(id,stage,qualification_status,business:businesses!leads_business_id_organization_id_fkey(name))")
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
    .select("*, lead:leads!opportunities_lead_id_organization_id_fkey(id,stage,qualification_status,business:businesses!leads_business_id_organization_id_fkey(id,name),primary_contact:contacts!leads_primary_contact_id_organization_id_fkey(id,full_name,email,phone))")
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listOpportunityStageHistory(organizationId: string, opportunityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("opportunity_stage_history")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("opportunity_id", opportunityId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createOpportunity(organizationId: string, input: OpportunityInput) {
  if (!input.lead_id) throw new Error("A lead is required to create an opportunity.");
  const supabase = await createClient();
  const normalized = normalizeInput(input);

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id,stage,qualification_status,status,deleted_at")
    .eq("organization_id", organizationId)
    .eq("id", input.lead_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (leadError) throw leadError;
  if (!lead) throw new Error("Lead not found.");
  if (lead.status === "CLOSED" || lead.status === "ARCHIVED") throw new Error("This lead is closed and cannot receive a new opportunity.");
  if (lead.qualification_status !== "QUALIFIED") {
    throw new Error("This lead must be qualified before an opportunity can be created.");
  }

  const { data, error } = await supabase
    .from("opportunities")
    .insert({ ...normalized, organization_id: organizationId })
    .select("*")
    .single();
  if (error) throw error;

  const { error: historyError } = await supabase.from("opportunity_stage_history").insert({
    organization_id: organizationId,
    opportunity_id: data.id,
    from_stage: null,
    to_stage: data.stage,
    reason: "Opportunity created",
  });
  if (historyError) throw historyError;

  return data;
}

export async function advanceOpportunity(organizationId: string, opportunityId: string) {
  const current = await getOpportunity(organizationId, opportunityId);
  if (!current) throw new Error("Opportunity not found.");
  if (current.status !== "OPEN") throw new Error("Only open opportunities can move through the pipeline.");

  const stages: OpportunityStage[] = ["DISCOVERY", "SOLUTIONING", "PROPOSAL", "NEGOTIATION", "CONTRACTING", "DELIVERY"];
  const currentIndex = stages.indexOf(current.stage as OpportunityStage);
  const nextStage = stages[currentIndex + 1];
  if (!nextStage) throw new Error("This opportunity is already at the final delivery stage.");

  return moveOpportunityStage(organizationId, opportunityId, nextStage);
}

export async function moveOpportunityStage(organizationId: string, opportunityId: string, nextStage: OpportunityStage) {
  const supabase = await createClient();
  const current = await getOpportunity(organizationId, opportunityId);
  if (!current) throw new Error("Opportunity not found.");
  if (current.status !== "OPEN") throw new Error("Only open opportunities can move through the pipeline.");
  assertOpportunityStageTransition(current.stage as OpportunityStage, nextStage);

  const { data, error } = await supabase
    .from("opportunities")
    .update({ stage: nextStage })
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
    .select("*")
    .single();
  if (error) throw error;

  const { error: historyError } = await supabase.from("opportunity_stage_history").insert({
    organization_id: organizationId,
    opportunity_id: opportunityId,
    from_stage: current.stage,
    to_stage: nextStage,
    reason: null,
  });
  if (historyError) throw historyError;

  return data;
}

export async function closeOpportunity(organizationId: string, opportunityId: string, status: Extract<OpportunityStatus, "WON" | "LOST">, lostReason?: string | null) {
  const supabase = await createClient();
  const current = await getOpportunity(organizationId, opportunityId);
  if (!current) throw new Error("Opportunity not found.");

  const reason = cleanOptional(lostReason);
  if (status === "LOST" && !reason) throw new Error("A lost reason is required when closing an opportunity as LOST.");

  const { data, error } = await supabase
    .from("opportunities")
    .update({
      status,
      lost_reason: status === "LOST" ? reason : null,
      closed_at: current.closed_at ?? new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
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

  const closed = normalized.status === "WON" || normalized.status === "LOST";
  const { data, error } = await supabase
    .from("opportunities")
    .update({
      ...normalized,
      closed_at: closed ? current.closed_at ?? new Date().toISOString() : null,
    })
    .eq("organization_id", organizationId)
    .eq("id", opportunityId)
    .select("*")
    .single();
  if (error) throw error;

  if (current.stage !== normalized.stage) {
    const { error: historyError } = await supabase.from("opportunity_stage_history").insert({
      organization_id: organizationId,
      opportunity_id: opportunityId,
      from_stage: current.stage,
      to_stage: normalized.stage,
      reason: null,
    });
    if (historyError) throw historyError;
  }

  return data;
}
