import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listLeads } from "@/lib/domains/leads/service";

const stageVariant: Record<string, "primary" | "info" | "warning" | "success" | "neutral"> = {
  NEW: "primary",
  CONTACTED: "info",
  QUALIFYING: "info",
  QUALIFIED: "success",
  CONNECTED: "info",
  INTERESTED: "success",
  NURTURE: "warning",
};

const priorityVariant: Record<string, "danger" | "warning" | "info" | "neutral"> = {
  URGENT: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

export default async function LeadsPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const leads = await listLeads(organization.id);

  const open = leads.filter((l) => l.status === "ACTIVE");
  const other = leads.filter((l) => l.status !== "ACTIVE");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">CRM</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Leads</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {leads.length > 0
                ? `${open.length} open lead${open.length === 1 ? "" : "s"} · ${leads.length} total`
                : "Sales relationships between businesses and opportunities."}
            </p>
          </div>
          <Button asChild>
            <Link href="/leads/new"><Plus className="size-4" />New lead</Link>
          </Button>
        </div>

        {leads.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-5 py-16 text-center">
            <Users className="mb-3 size-10 text-text-muted" strokeWidth={1.2} />
            <p className="text-sm font-medium">No leads yet</p>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Create a lead from a business once it is ready for sales qualification.
            </p>
            <Button asChild className="mt-5" size="sm">
              <Link href="/leads/new">Create first lead</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Open leads */}
            {open.length > 0 && (
              <LeadTable title="Open" count={open.length} leads={open} />
            )}
            {/* Other leads */}
            {other.length > 0 && (
              <LeadTable title="Closed / On hold" count={other.length} leads={other} muted />
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LeadTable({
  title,
  count,
  leads,
  muted,
}: {
  title: string;
  count: number;
  leads: Awaited<ReturnType<typeof listLeads>>;
  muted?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted/40 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
        <Badge variant="neutral">{count}</Badge>
      </div>
      {/* Table header */}
      <div className="hidden grid-cols-[2fr_1fr_130px_100px_90px] gap-4 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted md:grid">
        <span>Business</span>
        <span>Contact</span>
        <span>Stage</span>
        <span>Priority</span>
        <span>Status</span>
      </div>
      <div className="divide-y divide-border">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className={`group grid gap-2 px-5 py-4 transition-colors hover:bg-surface-muted/50 md:grid-cols-[2fr_1fr_130px_100px_90px] md:items-center md:gap-4 ${muted ? "opacity-60 hover:opacity-100" : ""}`}
          >
            <div className="min-w-0">
              <span className="block font-medium text-foreground transition-colors group-hover:text-primary truncate">
                {lead.business?.name ?? "Unknown business"}
              </span>
              {lead.source && (
                <span className="mt-0.5 block text-xs text-text-muted">via {lead.source}</span>
              )}
            </div>
            <span className="truncate text-sm text-text-secondary">
              {lead.primary_contact?.full_name ?? <span className="text-text-muted">No contact</span>}
            </span>
            <div>
              <Badge variant={stageVariant[lead.stage ?? ""] ?? "neutral"}>{lead.stage}</Badge>
            </div>
            <div>
              {lead.priority_score != null ? (
                <Badge variant={lead.priority_score >= 70 ? "danger" : lead.priority_score >= 40 ? "warning" : "neutral"}>
                  {lead.priority_score}
                </Badge>
              ) : (
                <span className="text-sm text-text-muted">—</span>
              )}
            </div>
            <span className="text-sm text-text-secondary">{lead.status}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
