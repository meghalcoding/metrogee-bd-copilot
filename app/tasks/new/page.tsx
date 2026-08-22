import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listBusinesses } from "@/lib/domains/businesses/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{
    business?: string;
    lead?: string;
    opportunity?: string;
  }>;
}) {
  const params = await searchParams;
  const organization = await getCurrentOrganization();

  if (!organization) return null;

  const [businesses, leads, opportunities] = await Promise.all([
    listBusinesses(organization.id),
    listLeads(organization.id),
    listOpportunities(organization.id),
  ]);

  const businessOptions = businesses.map((business) => ({
    id: business.id,
    name: business.name,
  }));

const leadOptions = leads.map((lead) => ({
  id: lead.id,
  name: `${lead.business?.name ?? "Lead"} — ${lead.stage ?? "NEW"}`,
  businessId: lead.business_id,
}));

const opportunityOptions = opportunities.map((opportunity) => ({
  id: opportunity.id,
  name: opportunity.name,
  leadId: opportunity.lead_id,
}));

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/tasks"
          className="text-sm font-medium text-text-secondary hover:text-foreground"
        >
          ← Tasks
        </Link>

        <div>
          <h1>New task</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create one concrete action for the BD team.
          </p>
        </div>

        <TaskForm
          businessId={params.business}
          leadId={params.lead}
          opportunityId={params.opportunity}
          businesses={businessOptions}
          leads={leadOptions}
          opportunities={opportunityOptions}
        />
      </div>
    </AppShell>
  );
}