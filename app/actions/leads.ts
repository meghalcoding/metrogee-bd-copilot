"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { archiveLead, createLead, updateLead } from "@/lib/domains/leads/service";
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

export async function archiveLeadAction(leadId: string) {
  const { organization } = await context();
  await archiveLead(organization.id, leadId);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
