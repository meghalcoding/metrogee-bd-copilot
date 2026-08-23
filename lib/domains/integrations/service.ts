import { createClient } from "@/lib/supabase/server";
import { getIntegrationDefinition, INTEGRATION_DEFINITIONS } from "./definitions";
import type { IntegrationProvider, IntegrationRecord, IntegrationStatus } from "./types";

export async function listIntegrations(organizationId: string): Promise<IntegrationRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .order("type")
    .order("display_name");

  if (error) throw error;
  return (data ?? []) as IntegrationRecord[];
}

export async function upsertIntegration(
  organizationId: string,
  provider: IntegrationProvider,
  enabled: boolean,
) {
  const definition = getIntegrationDefinition(provider);
  if (!definition) throw new Error("Unsupported integration provider.");

  const supabase = await createClient();
  const status: IntegrationStatus = enabled ? "CONNECTED" : "DISABLED";

  const { data, error } = await supabase
    .from("organization_integrations")
    .upsert(
      {
        organization_id: organizationId,
        type: definition.type,
        provider: definition.provider,
        display_name: definition.displayName,
        enabled,
        status,
        last_error: null,
        connected_at: enabled ? new Date().toISOString() : null,
      },
      { onConflict: "organization_id,provider" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as IntegrationRecord;
}

export async function disconnectIntegration(organizationId: string, provider: IntegrationProvider) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_integrations")
    .update({
      enabled: false,
      status: "DISCONNECTED" as IntegrationStatus,
      connected_at: null,
      last_error: null,
    })
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as IntegrationRecord | null;
}

export async function getIntegration(organizationId: string, provider: IntegrationProvider) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_integrations")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("provider", provider)
    .maybeSingle();

  if (error) throw error;
  return data as IntegrationRecord | null;
}

export function mergeDefinitionsWithConnections(connections: IntegrationRecord[]) {
  const byProvider = new Map(connections.map((item) => [item.provider, item]));
  return INTEGRATION_DEFINITIONS.map((definition) => ({
    definition,
    connection: byProvider.get(definition.provider) ?? null,
  }));
}
