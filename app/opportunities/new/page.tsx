import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getLead } from "@/lib/domains/leads/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function NewOpportunityPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requireUser(); const { lead: leadId } = await searchParams; const organization = await getCurrentOrganization(); if (!organization || !leadId) redirect("/leads"); const lead = await getLead(organization.id, leadId); if (!lead) redirect("/leads");
  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-medium text-primary">New opportunity</p><h1 className="mt-1">Create opportunity</h1><p className="mt-2 text-sm text-text-secondary">{lead.business?.name ?? "Lead"} · {lead.stage}</p></div><OpportunityForm leadId={leadId} /></div></AppShell>;
}
