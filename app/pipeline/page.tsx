import Link from "next/link";
import { DollarSign } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { OPPORTUNITY_STAGES } from "@/lib/domains/opportunities/types";
import { AdvanceOpportunityButton } from "@/components/pipeline/advance-opportunity-button";
import { requireUser } from "@/lib/auth/require-user";

export default async function PipelinePage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const all = await listOpportunities(organization.id);
  const opportunities = all.filter((item) => item.status === "OPEN" || item.status === "ON_HOLD");
  const closed = all.filter((item) => item.status === "WON" || item.status === "LOST");
  const totalValue = opportunities.reduce((sum, item) => sum + Number(item.value_amount ?? 0), 0);

  return <AppShell><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">CRM</p><h1 className="mt-1">Pipeline</h1><p className="mt-2 text-sm text-text-secondary">Each column is a deal stage. Move deals forward, correct mistakes backward, or close the specific opportunity as won or lost.</p></div><div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"><DollarSign className="size-4 text-text-muted"/><span className="text-sm font-semibold">{totalValue.toLocaleString()}</span><span className="text-xs text-text-muted">open value</span></div></div>
    <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-3 xl:grid-cols-6">
      {OPPORTUNITY_STAGES.map((stage) => {
        const items = opportunities.filter((item) => item.stage === stage);
        return <section key={stage} className="min-w-[260px] rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{stage}</span><Badge variant="neutral">{items.length}</Badge></div>
          <div className="space-y-3 p-3">
            {items.length ? items.map((opp) => <article key={opp.id} className="rounded-lg border border-border bg-background p-4 shadow-sm">
              <Link href={`/opportunities/${opp.id}`} className="block"><p className="text-sm font-semibold hover:text-primary">{opp.name}</p><p className="mt-1 text-xs text-text-secondary">{opp.lead?.business?.name ?? "Business"}</p><p className="mt-3 text-sm font-semibold">{opp.value_amount != null ? `${opp.currency} ${Number(opp.value_amount).toLocaleString()}` : "No value"}</p></Link>
              <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-text-muted">{opp.probability != null ? `${opp.probability}% probability` : "No probability"}</span>{stage !== "DELIVERY" && opp.status === "OPEN" ? <AdvanceOpportunityButton opportunityId={opp.id}/> : <Link href={`/opportunities/${opp.id}`} className="text-xs font-medium text-primary">Open deal</Link>}</div>
            </article>) : <p className="py-8 text-center text-xs text-text-muted">No open opportunities</p>}
          </div>
        </section>;
      })}
    </div>
    <section className="rounded-xl border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold">Closed opportunities</h2><p className="mt-1 text-xs text-text-muted">Won and lost deals leave the active pipeline but remain available as records.</p></div><Badge variant="neutral">{closed.length}</Badge></div>{closed.length ? <div className="divide-y divide-border">{closed.slice(0, 20).map((opp) => <Link key={opp.id} href={`/opportunities/${opp.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-muted/60"><div><p className="text-sm font-semibold">{opp.name}</p><p className="mt-1 text-xs text-text-secondary">{opp.lead?.business?.name ?? "Business"} · {opp.stage}</p></div><div className="flex items-center gap-3"><Badge variant={opp.status === "LOST" ? "danger" : "neutral"}>{opp.status}</Badge><span className="text-sm font-semibold">{opp.value_amount != null ? `${opp.currency} ${Number(opp.value_amount).toLocaleString()}` : "—"}</span></div></Link>)}</div> : <div className="px-5 py-8 text-sm text-text-secondary">No closed opportunities yet.</div>}</section>
  </div></AppShell>;
}
