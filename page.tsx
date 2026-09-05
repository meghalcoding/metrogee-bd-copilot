import Link from "next/link";
import {
  ArrowUpRight, Building2, CalendarDays, CheckCircle2,
  CheckSquare, Clock3, IndianRupee, Plus, ScanSearch,
  Sparkles, Target, TrendingUp, Users, Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getActionCenterData } from "@/lib/domains/actions/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { listBusinesses } from "@/lib/domains/businesses/service";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", month: "long", day: "numeric",
  });
}

export default async function Home() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;

  // Fetch all real data in parallel
  const [actionData, leads, opportunities, businesses] = await Promise.all([
    getActionCenterData(organization.id),
    listLeads(organization.id),
    listOpportunities(organization.id),
    listBusinesses(organization.id),
  ]);

  // Leads
  const activeLeads = leads.filter((l) => l.status === "ACTIVE");

  // Opportunities
  const openOpps = opportunities.filter((o) => o.status === "OPEN" || o.status === "ON_HOLD");

  // Won this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const wonThisMonth = opportunities.filter(
    (o) => o.status === "WON" && o.closed_at && new Date(o.closed_at) >= monthStart,
  );
  const wonLastMonth = opportunities.filter((o) => {
    if (o.status !== "WON" || !o.closed_at) return false;
    const d = new Date(o.closed_at);
    return d >= new Date(now.getFullYear(), now.getMonth() - 1, 1) && d < monthStart;
  });

  // Total open pipeline value
  const openValue = openOpps.reduce((s, o) => s + Number(o.value_amount ?? 0), 0);

  // Pipeline by stage (open only)
  const STAGES = ["DISCOVERY", "SOLUTIONING", "PROPOSAL", "NEGOTIATION", "CONTRACTING", "DELIVERY"] as const;
  const stageGroups = STAGES.map((stage) => ({
    stage,
    count: openOpps.filter((o) => o.stage === stage).length,
  })).filter((s) => s.count > 0);
  const maxStageCount = Math.max(...stageGroups.map((s) => s.count), 1);

  // Businesses without website (quick wins for BDEs)
  const noWebsite = businesses.filter((b) => b.website_status === "W0").length;

  // Task summary
  const { openTaskCount, overdueTaskCount, dueTodayTaskCount, highPriorityTaskCount, recommendations } = actionData;
  const priorityActions = recommendations.length + highPriorityTaskCount;

  // Win rate
  const totalClosed = opportunities.filter((o) => o.status === "WON" || o.status === "LOST").length;
  const winRate = totalClosed > 0 ? Math.round((opportunities.filter((o) => o.status === "WON").length / totalClosed) * 100) : null;

  // Month comparison
  const wonDelta = wonLastMonth.length > 0
    ? Math.round(((wonThisMonth.length - wonLastMonth.length) / wonLastMonth.length) * 100)
    : null;

  return (
    <AppShell>
      <div className="space-y-7">
        {/* Header */}
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-primary">{getTodayLabel()}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {getGreeting()}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              {priorityActions > 0
                ? `You have ${priorityActions} priority action${priorityActions === 1 ? "" : "s"} today.`
                : "All clear — no priority actions right now."}
            </p>
          </div>
          <Button asChild>
            <Link href="/leads/new"><Plus className="size-4" />New lead</Link>
          </Button>
        </section>

        {/* Stats */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Priority actions"
            value={priorityActions}
            note={overdueTaskCount > 0 ? `${overdueTaskCount} overdue task${overdueTaskCount > 1 ? "s" : ""}` : "Based on recommendations + tasks"}
            icon={Zap}
            href="/actions"
            urgent={overdueTaskCount > 0}
          />
          <StatCard
            label="Active leads"
            value={activeLeads.length}
            note={activeLeads.length > 0 ? `${leads.filter(l => l.stage === "NEW").length} new, ${leads.filter(l => l.stage === "INTERESTED").length} interested` : "No active leads yet"}
            icon={Users}
            href="/leads"
          />
          <StatCard
            label="Tasks due today"
            value={dueTodayTaskCount}
            note={openTaskCount > 0 ? `${openTaskCount} open total${overdueTaskCount > 0 ? `, ${overdueTaskCount} overdue` : ""}` : "No open tasks"}
            icon={CheckSquare}
            href="/tasks"
            urgent={overdueTaskCount > 0}
          />
          <StatCard
            label="Won this month"
            value={wonThisMonth.length}
            note={
              wonDelta !== null
                ? `${wonDelta >= 0 ? "+" : ""}${wonDelta}% vs last month`
                : winRate !== null
                  ? `${winRate}% overall win rate`
                  : "No closed deals yet"
            }
            icon={CheckCircle2}
            href="/pipeline"
          />
        </section>

        {/* Main content */}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          {/* Action queue */}
          <div className="rounded-xl border border-border bg-surface shadow-sm shadow-slate-950/[0.02]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold">Action queue</h2>
                <p className="mt-0.5 text-xs text-text-muted">Recommended next steps from the rules engine.</p>
              </div>
              <Link href="/actions" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover">
                View all <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            {recommendations.length === 0 && openTaskCount === 0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center">
                <CheckCircle2 className="mb-3 size-8 text-success" strokeWidth={1.4} />
                <p className="text-sm font-medium">All clear</p>
                <p className="mt-1 text-sm text-text-secondary">No recommended actions right now. Keep the pipeline moving.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Tasks due today / overdue */}
                {dueTodayTaskCount > 0 && (
                  <ActionRow
                    title={`${dueTodayTaskCount} task${dueTodayTaskCount > 1 ? "s" : ""} due today`}
                    detail={overdueTaskCount > 0 ? `Including ${overdueTaskCount} overdue — needs immediate attention.` : "Review and complete your scheduled work."}
                    priority={overdueTaskCount > 0 ? "Overdue" : "Today"}
                    priorityVariant={overdueTaskCount > 0 ? "danger" : "info"}
                    meta={`${openTaskCount} open total`}
                    href="/tasks"
                  />
                )}
                {/* High priority tasks (if none due today) */}
                {dueTodayTaskCount === 0 && highPriorityTaskCount > 0 && (
                  <ActionRow
                    title={`${highPriorityTaskCount} high-priority task${highPriorityTaskCount > 1 ? "s" : ""}`}
                    detail="Urgent or high priority tasks need your attention."
                    priority="High"
                    priorityVariant="warning"
                    meta={`${openTaskCount} open total`}
                    href="/tasks"
                  />
                )}
                {/* Recommendations from rules engine */}
                {recommendations.slice(0, 4).map((rec) => (
                  <ActionRow
                    key={rec.id}
                    title={rec.title}
                    detail={rec.reason}
                    priority={rec.priority}
                    priorityVariant={
                      rec.priority === "URGENT" || rec.priority === "HIGH" ? "danger"
                      : rec.priority === "NORMAL" ? "info" : "neutral"
                    }
                    meta={rec.score != null ? `Lead score: ${rec.score}` : undefined}
                    href={rec.href}
                  />
                ))}
                {/* Businesses without website */}
                {noWebsite > 0 && (
                  <ActionRow
                    title={`${noWebsite} business${noWebsite > 1 ? "es" : ""} without a website`}
                    detail="These are easier targets — no digital competition yet."
                    priority="Prospect"
                    priorityVariant="info"
                    meta={`${businesses.length} total businesses`}
                    href="/businesses"
                  />
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Pipeline snapshot */}
            <div className="rounded-xl border border-border bg-surface shadow-sm shadow-slate-950/[0.02]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">Pipeline</h2>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {openOpps.length} open deal{openOpps.length !== 1 ? "s" : ""}
                    {openValue > 0 && ` · ₹${openValue.toLocaleString("en-IN")}`}
                  </p>
                </div>
                <Link href="/pipeline" className="text-xs font-semibold text-primary hover:text-primary-hover">
                  Open →
                </Link>
              </div>

              {stageGroups.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-10 text-center">
                  <TrendingUp className="mb-2 size-7 text-text-muted" strokeWidth={1.4} />
                  <p className="text-sm text-text-secondary">No open opportunities yet.</p>
                  <Link href="/opportunities/new" className="mt-3 text-xs font-semibold text-primary hover:underline">
                    Create first deal →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3.5 p-5">
                  {stageGroups.map(({ stage, count }) => (
                    <div key={stage}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium capitalize text-text-secondary">
                          {stage.charAt(0) + stage.slice(1).toLowerCase()}
                        </span>
                        <span className="font-semibold text-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((count / maxStageCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm shadow-slate-950/[0.02]">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Quick access</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Prospect", href: "/prospecting", icon: ScanSearch },
                  { label: "Business Radar", href: "/radar", icon: Target },
                  { label: "Businesses", href: "/businesses", icon: Building2 },
                  { label: "Meetings", href: "/meetings", icon: CalendarDays },
                ].map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-muted hover:text-foreground"
                  >
                    <Icon className="size-3.5 shrink-0 text-text-muted" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Win rate */}
            {totalClosed > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Overall win rate</p>
                  <IndianRupee className="size-3.5 text-text-muted" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{winRate}%</p>
                <p className="mt-1 text-xs text-text-muted">
                  {opportunities.filter((o) => o.status === "WON").length} won of {totalClosed} closed
                </p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${winRate}%` }} />
                </div>
              </div>
            )}

            {/* Businesses at a glance */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Businesses</p>
                <Link href="/businesses" className="text-xs font-semibold text-primary hover:text-primary-hover">View all →</Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-lg font-semibold">{businesses.length}</p>
                  <p className="mt-0.5 text-[10px] text-text-muted">Total</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-lg font-semibold text-success">{businesses.filter(b => b.website_status === "WU").length}</p>
                  <p className="mt-0.5 text-[10px] text-text-muted">With website</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-lg font-semibold text-danger">{noWebsite}</p>
                  <p className="mt-0.5 text-[10px] text-text-muted">No website</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  label, value, note, icon: Icon, href, urgent,
}: {
  label: string; value: number; note: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  href: string; urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-xl border bg-surface p-5 shadow-sm shadow-slate-950/[0.02] transition-colors hover:border-border-strong hover:bg-surface-muted/40 ${
        urgent ? "border-danger/30" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <Icon className={`size-4 transition-colors group-hover:text-primary ${urgent ? "text-danger" : "text-text-muted"}`} strokeWidth={1.8} />
      </div>
      <div className={`mt-4 text-2xl font-semibold tracking-tight ${urgent && value > 0 ? "text-danger" : "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-text-muted">{note}</div>
    </Link>
  );
}

function ActionRow({
  title, detail, priority, priorityVariant, meta, href,
}: {
  title: string; detail: string; priority: string;
  priorityVariant: "danger" | "warning" | "info" | "success" | "neutral";
  meta?: string; href: string;
}) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <Badge variant={priorityVariant}>{priority}</Badge>
        </div>
        <p className="mt-1 text-sm leading-5 text-text-secondary">{detail}</p>
        {meta && <p className="mt-1.5 text-xs font-medium text-text-muted">{meta}</p>}
      </div>
      <Button asChild variant="secondary" size="sm">
        <Link href={href}>Review</Link>
      </Button>
    </div>
  );
}
