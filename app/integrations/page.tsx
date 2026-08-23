import { AppShell } from "@/components/layout/app-shell";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import {
  listIntegrations,
  mergeDefinitionsWithConnections,
} from "@/lib/domains/integrations/service";

export default async function IntegrationsPage() {
  const organization = await getCurrentOrganization();
  if (!organization) {
    return <AppShell><div className="p-6">No current organization.</div></AppShell>;
  }

  const connections = await listIntegrations(organization.id);
  const integrations = mergeDefinitionsWithConnections(connections);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">System</p>
          <h1 className="mt-1">Integrations</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            Connect external services to this workspace. This page establishes the integration registry; provider authentication and CRM actions are added independently.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Integration architecture</h2>
          <p className="mt-1 text-sm text-text-secondary">
            CRM domains use provider-neutral capabilities. A provider can be connected or disabled without changing Business, Lead, Opportunity, Task, or Activity records.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map(({ definition, connection }) => (
            <IntegrationCard
              key={definition.provider}
              definition={definition}
              connection={connection}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
