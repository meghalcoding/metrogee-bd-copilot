import Link from "next/link";
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, ListChecks, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteTaskButton } from "@/components/actions/complete-task-button";
import { RecommendedActionCard } from "@/components/actions/recommended-action-card";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getActionCenterData } from "@/lib/domains/actions/service";
import { listTasks } from "@/lib/domains/tasks/service";

function dayStart(date: Date) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
function dayEnd(date: Date) { const d = new Date(date); d.setHours(23,59,59,999); return d; }

export default async function ActionCenterPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const [data, tasks] = await Promise.all([getActionCenterData(organization.id), listTasks(organization.id)]);
  const openTasks = tasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS");
  const now = new Date(); const today = dayStart(now); const endToday = dayEnd(now);
  const overdue = openTasks.filter((task) => task.due_at && new Date(task.due_at) < now);
  const dueToday = openTasks.filter((task) => task.due_at && new Date(task.due_at) >= today && new Date(task.due_at) <= endToday);
  const upcoming = openTasks.filter((task) => task.due_at && new Date(task.due_at) > endToday);
  const noDueDate = openTasks.filter((task) => !task.due_at);
  const sections = [
    { title: "Overdue", icon: AlertCircle, tasks: overdue, description: "Open work that has passed its due time." },
    { title: "Due today", icon: CalendarClock, tasks: dueToday, description: "Tasks that should be handled today." },
    { title: "Upcoming", icon: Clock3, tasks: upcoming, description: "Scheduled future work." },
    { title: "No due date", icon: ListChecks, tasks: noDueDate, description: "Open work without a scheduled time." },
  ];

  return <AppShell><div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Workspace</p><h1 className="mt-1">Action Center</h1><p className="mt-2 max-w-2xl text-sm text-text-secondary">Recommended work plus your committed tasks. Recommendations are deterministic, explainable and never auto-create tasks.</p></div><Button asChild><Link href="/tasks/new"><Plus className="size-4"/>New task</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Open work" value={data.openTaskCount} note="OPEN + IN_PROGRESS" icon={ListChecks}/><Stat label="Overdue" value={data.overdueTaskCount} note="Needs attention" icon={AlertCircle}/><Stat label="Due today" value={data.dueTodayTaskCount} note="Today's queue" icon={CalendarClock}/><Stat label="High priority" value={data.highPriorityTaskCount} note="HIGH + URGENT" icon={CheckCircle2}/></div>

    <section className="space-y-4"><div className="flex items-end justify-between gap-4"><div><div className="flex items-center gap-2"><Sparkles className="size-4 text-primary"/><h2 className="text-base font-semibold">Recommended next actions</h2></div><p className="mt-1 text-sm text-text-secondary">The rule engine evaluates current CRM state, history and time conditions.</p></div><Badge variant="neutral">{data.recommendations.length}</Badge></div>{data.recommendations.length ? <div className="grid gap-4 lg:grid-cols-2">{data.recommendations.slice(0, 8).map((action) => <RecommendedActionCard key={action.id} action={action}/>)}</div> : <div className="rounded-xl border border-border bg-surface px-5 py-8 text-sm text-text-secondary">No rule-based recommendations right now.</div>}</section>

    <div className="space-y-5"><div><h2 className="text-base font-semibold">Committed tasks</h2><p className="mt-1 text-sm text-text-secondary">Tasks remain separate from recommendations and represent work you have explicitly committed to.</p></div>{sections.map((section) => <section key={section.title} className="rounded-xl border border-border bg-surface"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-3"><section.icon className="size-4 text-text-muted"/><div><h3 className="text-sm font-semibold">{section.title}</h3><p className="mt-1 text-xs text-text-muted">{section.description}</p></div></div><Badge variant="neutral">{section.tasks.length}</Badge></div>{section.tasks.length ? <div className="divide-y divide-border">{section.tasks.slice(0,20).map((task) => <div key={task.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={`/tasks/${task.id}/edit`} className="text-sm font-semibold hover:text-primary">{task.title}</Link><Badge variant={task.priority === "URGENT" || task.priority === "HIGH" ? "danger" : "neutral"}>{task.priority}</Badge><Badge variant="neutral">{task.status}</Badge></div><p className="mt-1 text-xs text-text-secondary">{task.business?.name ?? task.lead?.business?.name ?? task.opportunity?.name ?? "Related CRM record"}{task.due_at ? ` · ${new Date(task.due_at).toLocaleString()}` : " · No due date"}</p></div><CompleteTaskButton taskId={task.id}/></div>)}</div> : <div className="px-5 py-8 text-sm text-text-secondary">Nothing here.</div>}</section>)}</div>
  </div></AppShell>;
}
function Stat({ label, value, note, icon: Icon }: { label: string; value: number; note: string; icon: typeof ListChecks }) { return <div className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]"><div className="flex items-center justify-between"><span className="text-sm font-medium text-text-secondary">{label}</span><Icon className="size-4 text-text-muted"/></div><div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-xs text-text-muted">{note}</div></div>; }
