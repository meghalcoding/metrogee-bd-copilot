import Link from "next/link";
import { AlertTriangle, Building2, Globe2, PhoneOff, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getRadarSummary, listRadarBusinesses } from "@/lib/domains/radar/service";
import type { RadarSignal } from "@/lib/domains/radar/types";

const SIGNAL_LABELS: Record<RadarSignal, string> = {
  NO_LEAD: "No lead",
  WEBSITE_GAP: "Website gap",
  CONTACT_GAP: "Contact gap",
  QUALIFYING_LEAD: "Qualifying",
  ACTIVE_OPPORTUNITY: "Open opportunity",
};

const SIGNAL_VARIANTS: Record<RadarSignal, "danger" | "primary" | "neutral"> = {
  NO_LEAD: "primary",
  WEBSITE_GAP: "danger",
  CONTACT_GAP: "danger",
  QUALIFYING_LEAD: "neutral",
  ACTIVE_OPPORTUNITY: "primary",
};

export default async function RadarPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;

  const [businesses, summary] = await Promise.all([
    listRadarBusinesses(organization.id),
    getRadarSummary(organization.id),
  ]);

  return (
    <AppShell>
      <div className="space-y-7">
        <div>
          <p className="text-sm font-medium text-primary">Prospecting</p>
          <h1 className="mt-1">Business Radar</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-secondary">
            Deterministic signals from the CRM that show which business records need attention, enrichment, qualification, or follow-up.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Businesses" value={summary.businesses} icon={Building2} />
          <Stat label="Unworked" value={summary.unworked} icon={Target} />
          <Stat label="Website gaps" value={summary.websiteGaps} icon={Globe2} />
          <Stat label="Contact gaps" value={summary.contactGaps} icon={PhoneOff} />
          <Stat label="Open opportunities" value={summary.activeOpportunities} icon={AlertTriangle} />
        </div>

        <section className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold">Signals requiring attention</h2>
            <p className="mt-1 text-xs text-text-muted">Sorted by the number of transparent CRM signals on each business.</p>
          </div>

          {businesses.length ? (
            <div className="divide-y divide-border">
              {businesses.map((business) => (
                <div key={business.id} className="px-5 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/businesses/${business.id}`} className="text-sm font-semibold hover:text-primary">
                          {business.name}
                        </Link>
                        <Badge variant="neutral">{business.signal_count} signal{business.signal_count === 1 ? "" : "s"}</Badge>
                      </div>

                      <p className="mt-1 text-xs text-text-secondary">
                        {[business.city, business.state].filter(Boolean).join(", ") || "Location not recorded"}
                        {business.rating != null ? ` · ${business.rating} rating (${business.review_count ?? 0} reviews)` : ""}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {business.signals.map((signal) => (
                          <Badge key={signal} variant={SIGNAL_VARIANTS[signal]}>
                            {SIGNAL_LABELS[signal]}
                          </Badge>
                        ))}
                        {!business.signals.length && <Badge variant="neutral">No current signals</Badge>}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {business.lead_id ? (
                        <Link href={`/leads/${business.lead_id}`} className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-surface-muted">
                          Open lead
                        </Link>
                      ) : (
                        <Link href={`/leads/new?business=${business.id}`} className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-surface-muted">
                          Start lead
                        </Link>
                      )}
                      <Link href={`/businesses/${business.id}`} className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90">
                        View business
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-text-secondary">
              No business records are available for radar analysis.
            </div>
          )}
        </section>

        <p className="text-xs text-text-muted">
          Radar uses only existing business, lead, and opportunity records. It does not scrape websites, call external APIs, generate scores with AI, or create tasks automatically.
        </p>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Building2 }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <Icon className="size-4 text-text-muted" />
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}
