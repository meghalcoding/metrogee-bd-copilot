"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinessCategories } from "@/lib/domains/businesses/service";
import { addProspect, searchProspects } from "@/lib/domains/prospecting/service";
import type { ProspectResult, ProspectSearchInput } from "@/lib/domains/prospecting/types";

async function organizationContext() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function searchProspectsAction(input: ProspectSearchInput) {
  const { organization } = await organizationContext();
  const categories = await listBusinessCategories(organization.id);
  const category = categories.find((item) => item.id === input.categoryId && item.slug === input.categorySlug);
  if (!category) throw new Error("Select a valid business category.");
  return searchProspects(input, category.name);
}

export async function addProspectAction(categoryId: string, result: ProspectResult) {
  const { user, organization } = await organizationContext();
  const categories = await listBusinessCategories(organization.id);
  const category = categories.find((item) => item.id === categoryId);
  if (!category) throw new Error("Select a valid business category.");

  const saved = await addProspect(organization.id, user.id, category.id, category.name, result);
  revalidatePath("/businesses");
  revalidatePath("/radar");
  revalidatePath("/prospecting");
  return saved;
}
