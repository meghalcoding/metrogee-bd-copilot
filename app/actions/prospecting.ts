"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinessCategories } from "@/lib/domains/businesses/service";
import { addProspect, searchProspects } from "@/lib/domains/prospecting/service";
import { CUSTOM_CATEGORY } from "@/lib/domains/prospecting/categories";
import type { ProspectResult, ProspectSearchInput, ProspectSearchResult } from "@/lib/domains/prospecting/types";

async function organizationContext() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function searchProspectsAction(input: ProspectSearchInput) {
  const { organization } = await organizationContext();

  // Allow "custom" category (free-text) without DB validation
  if (input.categorySlug === "custom") {
    if (!input.customQuery?.trim()) throw new Error("Enter a search term for custom search.");
    return searchProspects(input, input.customQuery.trim());
  }

  const categories = await listBusinessCategories(organization.id);
  const category = categories.find(
    (item) => item.id === input.categoryId && item.slug === input.categorySlug,
  );
  if (!category) throw new Error("Select a valid business category.");
  return searchProspects(input, category.name);
}

export async function addProspectAction(
  categoryId: string,
  result: ProspectResult,
  resolvedLocation?: ProspectSearchResult["location"],
) {
  const { user, organization } = await organizationContext();

  // Allow custom category
  if (categoryId === "custom") {
    const saved = await addProspect(
      organization.id,
      user.id,
      "custom",
      "Custom search",
      result,
      resolvedLocation,
    );
    revalidatePath("/businesses");
    revalidatePath("/radar");
    revalidatePath("/prospecting");
    return saved;
  }

  const categories = await listBusinessCategories(organization.id);
  const category = categories.find((item) => item.id === categoryId);
  if (!category) throw new Error("Select a valid business category.");

  const saved = await addProspect(
    organization.id,
    user.id,
    category.id,
    category.name,
    result,
    resolvedLocation,
  );
  revalidatePath("/businesses");
  revalidatePath("/radar");
  revalidatePath("/prospecting");
  return saved;
}

export async function bulkAddProspectsAction(
  categoryId: string,
  results: ProspectResult[],
  resolvedLocation?: ProspectSearchResult["location"],
) {
  const { user, organization } = await organizationContext();

  let categoryName = "Custom search";
  if (categoryId !== "custom") {
    const categories = await listBusinessCategories(organization.id);
    const category = categories.find((item) => item.id === categoryId);
    if (!category) throw new Error("Select a valid business category.");
    categoryName = category.name;
  }

  const outcomes = await Promise.allSettled(
    results.map((result) =>
      addProspect(organization.id, user.id, categoryId, categoryName, result, resolvedLocation),
    ),
  );

  revalidatePath("/businesses");
  revalidatePath("/radar");
  revalidatePath("/prospecting");

  return outcomes.map((outcome, i) => ({
    providerPlaceId: results[i].providerPlaceId,
    provider: results[i].provider,
    ...(outcome.status === "fulfilled"
      ? outcome.value
      : { status: "ERROR" as const, error: outcome.reason instanceof Error ? outcome.reason.message : "Unknown error" }),
  }));
}
