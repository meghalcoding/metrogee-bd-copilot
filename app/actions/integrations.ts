"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import {
  disconnectIntegration,
  upsertIntegration,
} from "@/lib/domains/integrations/service";
import type { IntegrationProvider } from "@/lib/domains/integrations/types";

async function context() {
  const user = await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) throw new Error("No current organization.");
  return { user, organization };
}

export async function setIntegrationEnabledAction(provider: IntegrationProvider, enabled: boolean) {
  const { organization } = await context();
  const result = await upsertIntegration(organization.id, provider, enabled);
  revalidatePath("/integrations");
  return result;
}

export async function disconnectIntegrationAction(provider: IntegrationProvider) {
  const { organization } = await context();
  const result = await disconnectIntegration(organization.id, provider);
  revalidatePath("/integrations");
  return result;
}
