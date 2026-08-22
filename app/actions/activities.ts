"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { createActivity } from "@/lib/domains/activities/service";
import type { ActivityInput } from "@/lib/domains/activities/types";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function createActivityAction(input: ActivityInput) {
  const { user, organization } = await context();
  const result = await createActivity(organization.id, {
    ...input,
    user_id: input.user_id ?? user.id,
  });

  revalidatePath("/activities");
  if (input.lead_id) revalidatePath(`/leads/${input.lead_id}`);
  if (input.opportunity_id) revalidatePath(`/opportunities/${input.opportunity_id}`);
  if (input.business_id) revalidatePath(`/businesses/${input.business_id}`);
  return result;
}
