"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import {
  disconnectIntegration,
  upsertIntegration,
} from "@/lib/domains/integrations/service";
import type { IntegrationProvider, SmtpConfig } from "@/lib/domains/integrations/types";
import { saveSmtpConfig, testSmtpConfig } from "@/lib/domains/integrations/smtp";

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


export async function testSmtpConfigAction(input: SmtpConfig) {
  await context();
  return testSmtpConfig(input);
}

export async function saveSmtpConfigAction(input: SmtpConfig) {
  const { organization } = await context();
  const result = await saveSmtpConfig(organization.id, input);
  revalidatePath("/integrations");
  return result;
}
