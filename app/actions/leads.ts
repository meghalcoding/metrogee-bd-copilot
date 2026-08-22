"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { archiveLead, createLead, getLead, updateLead } from "@/lib/domains/leads/service";
import type { LeadInput } from "@/lib/domains/leads/types";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function createLeadAction(input: LeadInput) {
  const { user, organization } = await context();
  const result = await createLead(organization.id, { ...input, owner_user_id: input.owner_user_id ?? user.id });
  revalidatePath("/leads");
  revalidatePath(`/businesses/${input.business_id}`);
  return result;
}

export async function updateLeadAction(leadId: string, input: LeadInput) {
  const { organization } = await context();
  const result = await updateLead(organization.id, leadId, input);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return result;
}

export async function qualifyLeadForOpportunityAction(leadId: string) {
  const { organization } = await context();
  const current = await getLead(organization.id, leadId);
  if (!current) throw new Error("Lead not found.");

  const result = await updateLead(organization.id, leadId, {
    business_id: current.business_id,
    primary_contact_id: current.primary_contact_id,
    owner_user_id: current.owner_user_id,
    stage: "QUALIFIED",
    status: current.status,
    source: current.source,
    qualification_status: "QUALIFIED",
    opportunity_score: current.opportunity_score,
    priority_score: current.priority_score,
    next_action_at: current.next_action_at,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/leads/${leadId}/edit`);
  return result;
}

export async function archiveLeadAction(leadId: string) {
  const { organization } = await context();
  await archiveLead(organization.id, leadId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
