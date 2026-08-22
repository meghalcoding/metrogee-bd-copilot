import Link from "next/link";
import { AlertCircle, CalendarClock, CheckCircle2, Clock3, ListChecks, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteTaskButton } from "@/components/actions/complete-task-button";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listTasks } from "@/lib/domains/tasks/service";

function dayStart(date: Date) { const d = new Date(date); d.setHours(0,0,0,0); return d; }
function dayEnd(date: Date) { const d = new Date(date); d.setHours(23,59,59,999); return d; }

export default async function ActionCenterPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const tasks = await listTasks(organization.id);
  const openTasks = tasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS");
  const now = new Date();
  const today = dayStart(now);
  const endToday = dayEnd(now);
  const overdue = openTasks.filter((task) => task.due_at && new Date(task.due_at) < now);
  const dueToday = openTasks.filter((task) => task.due_at && new Date(task.due_at) >= today && new Date(task.due_at) <= endToday);
  const upcoming = openTasks.filter((task) => task.due_at && new Date(task.due_at) > endToday);
  const noDueDate = openTasks.filter((task) => !task.due_at);
  const highPriority = openTasks.filter((task) => task.priority === "HIGH" || task.priority === "URGENT");

  const sections = [
    { title: "Overdue", icon: AlertCircle, tasks: overdue, tone: "danger" as const, description: "Open work that has passed its due time." },
    { title: "Due today", icon: CalendarClock, tasks: dueToday, tone: "primary" as const, description: "Tasks that should be handled today." },
    { title: "Upcoming", icon: Clock3, tasks: upcoming, tone: "neutral" as const, description: "Scheduled future work." },
    { title: "No due date", icon: ListChecks, tasks: noDueDate, tone: "neutral" as const, description: "Open work without a scheduled time." },
  ];

  return <AppShell><div className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">Workspace</p><h1 className="mt-1">Action Center</h1><p className="mt-2 max-w-2xl text-sm text-text-secondary">A deterministic work queue built from Tasks. No AI ranking or automatic task generation.</p></div><Button asChild><Link href="/tasks/new"><Plus className="size-4"/>New task</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Open work" value={openTasks.length} note="OPEN + IN_PROGRESS" icon={ListChecks}/>
      <Stat label="Overdue" value={overdue.length} note="Needs attention" icon={AlertCircle}/>
      <Stat label="Due today" value={dueToday.length} note="Today's queue" icon={CalendarClock}/>
      <Stat label="High priority" value={highPriority.length} note="HIGH + URGENT" icon={CheckCircle2}/>
    </div>
    <div className="space-y-5">
      {sections.map((section) => <section key={section.title} className="rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-3"><section.icon className="size-4 text-text-muted"/><div><h2 className="text-sm font-semibold">{section.title}</h2><p className="mt-1 text-xs text-text-muted">{section.description}</p></div></div><Badge variant="neutral">{section.tasks.length}</Badge></div>
        {section.tasks.length ? <div className="divide-y divide-border">{section.tasks.slice(0, 20).map((task) => <div key={task.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Link href={`/tasks/${task.id}/edit`} className="text-sm font-semibold hover:text-primary">{task.title}</Link><Badge variant={task.priority === "URGENT" || task.priority === "HIGH" ? "danger" : "neutral"}>{task.priority}</Badge><Badge variant="neutral">{task.status}</Badge></div><p className="mt-1 text-xs text-text-secondary">{task.business?.name ?? task.lead?.business?.name ?? task.opportunity?.name ?? "Related CRM record"}{task.due_at ? ` · ${new Date(task.due_at).toLocaleString()}` : " · No due date"}</p></div><CompleteTaskButton taskId={task.id}/></div>)}</div> : <div className="px-5 py-8 text-sm text-text-secondary">Nothing here.</div>}
      </section>)}
    </div>
  </div></AppShell>;
}

function Stat({ label, value, note, icon: Icon }: { label: string; value: number; note: string; icon: typeof ListChecks }) { return <div className="rounded-xl border border-border bg-surface p-5 shadow-sm shadow-slate-950/[0.02]"><div className="flex items-center justify-between"><span className="text-sm font-medium text-text-secondary">{label}</span><Icon className="size-4 text-text-muted"/></div><div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div><div className="mt-1 text-xs text-text-muted">{note}</div></div>; }
