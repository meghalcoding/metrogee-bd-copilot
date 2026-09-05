import Link from "next/link";
import { IndianRupee, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { OPPORTUNITY_STAGES } from "@/lib/domains/opportunities/types";
import { AdvanceOpportunityButton } from "@/components/pipeline/advance-opportunity-button";
import { requireUser } from "@/lib/auth/require-user";

const stageColor: Record<string, string> = {
  DISCOVERY:   "border-t-border-strong",
  QUALIFIED:   "border-t-info",
  INTERESTED:  "border-t-primary",
  PROPOSAL:    "border-t-warning",
  NEGOTIATION: "border-t-warning",
  DELIVERY:    "border-t-success",
};

export default async function PipelinePage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const all = await listOpportunities(organization.id);
  const opportunities = all.filter((o) => o.status === "OPEN" || o.status === "ON_HOLD");
  const closed = all.filter((o) => o.status === "WON" || o.status === "LOST");
  const totalValue = opportunities.reduce((sum, o) => sum + Number(o.value_amount ?? 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">CRM</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Pipeline</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              Move deals forward, correct mistakes backward, or close as won or lost.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2">
              <IndianRupee className="size-3.5 text-text-muted" />
              <span className="text-sm font-semibold">{totalValue.toLocaleString("en-IN")}</span>
              <span className="text-xs text-text-muted">open value</span>
            </div>
            <Button asChild size="sm">
              <Link href="/opportunities/new"><Plus className="size-4" />New deal</Link>
            </Button>
          </div>
        </div>

        {/* Kanban board */}
        <div className="grid gap-3 overflow-x-auto pb-2 lg:grid-cols-3 xl:grid-cols-6">
          {OPPORTUNITY_STAGES.map((stage) => {
            const items = opportunities.filter((o) => o.stage === stage);
            const stageValue = items.reduce((s, o) => s + Number(o.value_amount ?? 0), 0);
            const color = stageColor[stage] ?? "border-t-border-strong";
            return (
              <section
                key={stage}
                className={`flex min-w-[240px] flex-col rounded-xl border border-border border-t-2 bg-surface ${color}`}
              >
                {/* Column header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{stage}</span>
                    {stageValue > 0 && (
                      <p className="mt-0.5 text-[10px] text-text-muted">₹{stageValue.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                  <Badge variant="neutral">{items.length}</Badge>
                </div>

                {/* Cards */}
                <div className="flex flex-1 flex-col gap-2.5 p-2.5">
                  {items.length ? (
                    items.map((opp) => (
                      <article
                        key={opp.id}
                        className="group rounded-lg border border-border bg-background p-3.5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <Link href={`/opportunities/${opp.id}`} className="block">
                          <p className="text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                            {opp.name}
                          </p>
                          <p className="mt-1 text-xs text-text-secondary truncate">
                            {opp.lead?.business?.name ?? "Business"}
                          </p>
                          <p className="mt-3 text-sm font-semibold text-foreground">
                            {opp.value_amount != null
                              ? `₹${Number(opp.value_amount).toLocaleString("en-IN")}`
                              : <span className="text-text-muted text-xs font-normal">No value set</span>}
                          </p>
                        </Link>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-text-muted">
                            {opp.probability != null ? `${opp.probability}%` : "—"}
                          </span>
                          {opp.status === "ON_HOLD" ? (
                            <Badge variant="warning">On hold</Badge>
                          ) : stage !== "DELIVERY" ? (
                            <AdvanceOpportunityButton opportunityId={opp.id} />
                          ) : (
                            <Link href={`/opportunities/${opp.id}`} className="text-xs font-medium text-primary hover:underline">
                              Close deal
                            </Link>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="flex-1 py-8 text-center text-xs text-text-muted">Empty</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>

        {/* Closed deals */}
        <section className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Closed deals</h2>
              <p className="mt-0.5 text-xs text-text-muted">Won and lost opportunities.</p>
            </div>
            <Badge variant="neutral">{closed.length}</Badge>
          </div>
          {closed.length ? (
            <div className="divide-y divide-border">
              {closed.slice(0, 20).map((opp) => (
                <Link
                  key={opp.id}
                  href={`/opportunities/${opp.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-muted/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{opp.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {opp.lead?.business?.name ?? "Business"} · {opp.stage}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={opp.status === "WON" ? "success" : "danger"}>{opp.status}</Badge>
                    <span className="text-sm font-semibold">
                      {opp.value_amount != null
                        ? `₹${Number(opp.value_amount).toLocaleString("en-IN")}`
                        : "—"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-5 py-10 text-center text-sm text-text-secondary">No closed deals yet.</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
