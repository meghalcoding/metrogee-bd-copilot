import { ArrowUpRight, CheckCircle2, Clock3, Plus, Sparkles, Target } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

const actions = [
  { title: "Review high-priority prospects", detail: "8 businesses scored 80+ and have no owned website.", priority: "High", meta: "8 prospects" },
  { title: "Follow up with active leads", detail: "3 qualified leads have had no activity for 3+ days.", priority: "Medium", meta: "3 leads" },
  { title: "Complete today's tasks", detail: "5 tasks are due today across your pipeline.", priority: "Today", meta: "5 tasks" },
];

export default function Home() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Saturday, August 22</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Good morning, John.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Your workspace is ready. Here are the actions that can move your pipeline forward today.</p>
          </div>
          <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover">
            <Plus className="size-4" /> New lead
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Priority actions", "14", "Need attention today", Target],
            ["Open leads", "42", "+6 this week", Sparkles],
            ["Tasks due", "5", "2 overdue", Clock3],
            ["Won this month", "7", "+18% vs. last month", CheckCircle2],
          ].map(([label, value, note, Icon]) => {
            const StatIcon = Icon as typeof Target;
            return (
              <div key={label as string} className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-secondary">{label as string}</span>
                  <StatIcon className="size-4 text-text-muted" strokeWidth={1.8} />
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value as string}</div>
                <div className="mt-1 text-xs text-text-muted">{note as string}</div>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <div className="rounded-xl border border-border bg-surface shadow-sm shadow-slate-950/[0.02]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Today&apos;s action queue</h2>
                <p className="mt-1 text-xs text-text-muted">Prioritized by deterministic sales rules.</p>
              </div>
              <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover">View all <ArrowUpRight className="size-3.5" /></button>
            </div>
            <div className="divide-y divide-border">
              {actions.map((action) => (
                <div key={action.title} className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                      <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">{action.priority}</span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-text-secondary">{action.detail}</p>
                    <p className="mt-2 text-xs font-medium text-text-muted">{action.meta}</p>
                  </div>
                  <button type="button" className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-muted">Review</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface shadow-sm shadow-slate-950/[0.02]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Pipeline snapshot</h2>
              <p className="mt-1 text-xs text-text-muted">Current opportunity distribution.</p>
            </div>
            <div className="space-y-5 p-5">
              {[
                ["Qualified", 12, "w-[72%]"],
                ["Contacted", 9, "w-[54%]"],
                ["Interested", 7, "w-[42%]"],
                ["Proposal", 4, "w-[24%]"],
              ].map(([stage, count, width]) => (
                <div key={stage as string}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-text-secondary">{stage as string}</span>
                    <span className="font-semibold text-foreground">{count as number}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div className={`h-full rounded-full bg-primary ${width as string}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
