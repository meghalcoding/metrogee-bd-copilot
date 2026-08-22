import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listLeads } from "@/lib/domains/leads/service";

export default async function LeadsPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const leads = await listLeads(organization.id);
  return <AppShell><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">CRM</p><h1 className="mt-1">Leads</h1><p className="mt-2 text-sm text-text-secondary">Sales relationships that sit between businesses and opportunities.</p></div><Button asChild><Link href="/leads/new"><Plus className="size-4" />New lead</Link></Button></div>
    <div className="overflow-hidden rounded-xl border border-border bg-surface"><div className="grid grid-cols-[1.4fr_1fr_130px_120px_110px] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"><span>Business</span><span>Contact</span><span>Stage</span><span>Priority</span><span>Status</span></div>{leads.length ? leads.map((lead) => <Link key={lead.id} href={`/leads/${lead.id}`} className="grid grid-cols-[1.4fr_1fr_130px_120px_110px] items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-0 hover:bg-surface-muted/60"><span className="font-medium">{lead.business?.name ?? "Unknown business"}</span><span className="text-text-secondary">{lead.primary_contact?.full_name ?? "No contact"}</span><span><Badge>{lead.stage}</Badge></span><span>{lead.priority_score ?? "—"}</span><span className="text-text-secondary">{lead.status}</span></Link>) : <div className="px-6 py-12 text-center"><p className="font-medium">No leads yet</p><p className="mt-1 text-sm text-text-secondary">Create a lead from a business once it is ready for sales qualification.</p></div>}</div>
  </div></AppShell>;
}
