"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { enrichBusiness } from "@/lib/domains/prospecting/enrichment";

export async function enrichBusinessAction(businessId: string) {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  const result = await enrichBusiness(organization.id, user.id, businessId);
  revalidatePath(`/businesses/${businessId}`);
  revalidatePath("/businesses");
  revalidatePath("/radar");
  return result;
}
