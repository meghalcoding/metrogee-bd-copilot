import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getOpportunity } from "@/lib/domains/opportunities/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function EditOpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(); const { id } = await params; const organization = await getCurrentOrganization(); if (!organization) return null; const opportunity = await getOpportunity(organization.id,id); if (!opportunity) notFound();
  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-medium text-primary">Opportunity</p><h1 className="mt-1">Update opportunity</h1><p className="mt-2 text-sm text-text-secondary">Pipeline transitions are validated by the opportunity domain service.</p></div><OpportunityForm leadId={opportunity.lead_id} opportunity={opportunity as never}/></div></AppShell>;
}
