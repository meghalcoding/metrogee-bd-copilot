import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getOpportunity } from "@/lib/domains/opportunities/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser(); const { id } = await params; const organization = await getCurrentOrganization(); if (!organization) return null; const opportunity = await getOpportunity(organization.id,id); if (!opportunity) notFound();
  return <AppShell><div className="space-y-6"><Link href={`/leads/${opportunity.lead_id}`} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-foreground"><ArrowLeft className="size-4"/>Lead</Link><section className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-start sm:p-6"><div><div className="flex flex-wrap items-center gap-2"><h1>{opportunity.name}</h1><Badge>{opportunity.stage}</Badge><Badge>{opportunity.status}</Badge></div><p className="mt-2 text-sm text-text-secondary">{opportunity.lead?.business?.name ?? "Business"}</p></div><Button asChild variant="secondary"><Link href={`/opportunities/${id}/edit`}><Pencil className="size-4"/>Edit</Link></Button></section><section className="rounded-xl border border-border bg-surface p-5"><dl className="grid gap-5 sm:grid-cols-4 text-sm"><Metric label="Value" value={opportunity.value_amount != null ? `${opportunity.currency} ${Number(opportunity.value_amount).toLocaleString()}` : "—"}/><Metric label="Probability" value={opportunity.probability != null ? `${opportunity.probability}%` : "—"}/><Metric label="Expected close" value={opportunity.expected_close_date ?? "—"}/><Metric label="Owner" value={opportunity.owner_user_id ?? "Unassigned"}/></dl></section></div></AppShell>;
}
function Metric({label,value}:{label:string;value:string}){return <div><dt className="text-xs text-text-muted">{label}</dt><dd className="mt-1 font-medium break-all">{value}</dd></div>}
