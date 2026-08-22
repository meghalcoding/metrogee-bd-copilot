import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LeadForm } from "@/components/leads/lead-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getLead } from "@/lib/domains/leads/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const lead = await getLead(organization.id, id);
  if (!lead) notFound();
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Lead</p>
          <h1 className="mt-1">Update sales state</h1>
          <p className="mt-2 text-sm text-text-secondary">Stage transitions are validated by the lead domain service.</p>
        </div>
        <LeadForm lead={lead} />
      </div>
    </AppShell>
  );
}
