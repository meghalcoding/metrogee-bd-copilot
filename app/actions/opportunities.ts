"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { advanceOpportunity, closeOpportunity, createOpportunity, reopenOpportunity, updateOpportunity } from "@/lib/domains/opportunities/service";
import type { OpportunityInput } from "@/lib/domains/opportunities/types";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function createOpportunityAction(input: OpportunityInput) {
  const { user, organization } = await context();
  const result = await createOpportunity(organization.id, { ...input, owner_user_id: input.owner_user_id ?? user.id });
  revalidatePath(`/leads/${input.lead_id}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return result;
}

export async function advanceOpportunityAction(opportunityId: string) {
  const { organization } = await context();
  const result = await advanceOpportunity(organization.id, opportunityId);
  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${opportunityId}`);
  if (result.lead_id) revalidatePath(`/leads/${result.lead_id}`);
  return result;
}

export async function closeOpportunityAction(opportunityId: string, status: "WON" | "LOST", lostReason?: string | null) {
  const { organization } = await context();
  const result = await closeOpportunity(organization.id, opportunityId, status, lostReason);
  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/leads/${result.lead_id}`);
  return result;
}

export async function reopenOpportunityAction(opportunityId: string) {
  const { organization } = await context();
  const result = await reopenOpportunity(organization.id, opportunityId);
  revalidatePath("/pipeline");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/leads/${result.lead_id}`);
  return result;
}

export async function updateOpportunityAction(opportunityId: string, input: OpportunityInput) {
  const { organization } = await context();
  const result = await updateOpportunity(organization.id, opportunityId, input);
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath(`/leads/${input.lead_id}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  return result;
}
