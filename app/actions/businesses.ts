"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import {
  archiveBusiness,
  createBusiness,
  updateBusiness,
} from "@/lib/domains/businesses/service";
import type { BusinessInput } from "@/lib/domains/businesses/types";

async function organizationContext() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function createBusinessAction(input: BusinessInput) {
  const { user, organization } = await organizationContext();
  const result = await createBusiness(organization.id, user.id, input);
  revalidatePath("/businesses");
  return result;
}

export async function updateBusinessAction(businessId: string, input: BusinessInput) {
  const { organization } = await organizationContext();
  const result = await updateBusiness(organization.id, businessId, input);
  revalidatePath("/businesses");
  revalidatePath(`/businesses/${businessId}`);
  return result;
}

export async function archiveBusinessAction(businessId: string) {
  const { organization } = await organizationContext();
  await archiveBusiness(organization.id, businessId);
  revalidatePath("/businesses");
}
