import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OpportunityForm } from "@/components/opportunities/opportunity-form";
import { QualifyLeadAndContinue } from "@/components/opportunities/qualify-lead-and-continue";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getLead } from "@/lib/domains/leads/service";
import { requireUser } from "@/lib/auth/require-user";
import { Button } from "@/components/ui/button";

export default async function NewOpportunityPage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  await requireUser();
  const { lead: leadId } = await searchParams;
  const organization = await getCurrentOrganization();
  if (!organization || !leadId) redirect("/leads");

  const lead = await getLead(organization.id, leadId);
  if (!lead) redirect("/leads");

  const returnTo = `/opportunities/new?lead=${encodeURIComponent(leadId)}`;

  if (lead.status === "CLOSED" || lead.status === "ARCHIVED") {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <Link href={`/leads/${leadId}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground"><ArrowLeft className="size-4" />Lead</Link>
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 size-5 text-danger" /><div><h1 className="text-xl font-semibold">This lead is closed</h1><p className="mt-2 text-sm text-text-secondary">Reopen the lead before creating another opportunity.</p></div></div>
            <Button asChild className="mt-5"><Link href={`/leads/${leadId}/edit?returnTo=${encodeURIComponent(returnTo)}`}>Open lead</Link></Button>
          </section>
        </div>
      </AppShell>
    );
  }

  const leadReady = lead.qualification_status === "QUALIFIED" && ["QUALIFIED", "CONTACTED", "CONNECTED", "INTERESTED"].includes(lead.stage);

  if (!leadReady) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-6">
          <Link href={`/leads/${leadId}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground"><ArrowLeft className="size-4" />Lead</Link>
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 size-5 text-primary" /><div><p className="text-sm font-medium text-primary">One step required</p><h1 className="mt-1 text-xl font-semibold">Qualify this lead before creating an opportunity</h1><p className="mt-2 text-sm text-text-secondary">The lead is currently {lead.stage} with qualification {lead.qualification_status}. An opportunity starts a commercial deal, so the lead needs to reach QUALIFIED first.</p></div></div>
            <div className="mt-5 flex flex-wrap gap-3"><QualifyLeadAndContinue leadId={leadId} returnTo={returnTo} /><Button asChild variant="secondary"><Link href={`/leads/${leadId}/edit?returnTo=${encodeURIComponent(returnTo)}`}>Review lead instead</Link></Button></div>
          </section>
        </div>
      </AppShell>
    );
  }

  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-medium text-primary">New opportunity</p><h1 className="mt-1">Create opportunity</h1><p className="mt-2 text-sm text-text-secondary">{lead.business?.name ?? "Lead"} · Lead is qualified. This is now a specific commercial deal.</p></div><OpportunityForm leadId={leadId} /></div></AppShell>;
}
