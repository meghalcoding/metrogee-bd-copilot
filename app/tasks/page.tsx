import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listTasks } from "@/lib/domains/tasks/service";

export default async function TasksPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const tasks = await listTasks(organization.id);

  return <AppShell><div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-primary">CRM</p><h1 className="mt-1">Tasks</h1><p className="mt-2 text-sm text-text-secondary">Actionable work for the BD team. Tasks are not historical records.</p></div><Button asChild><Link href="/tasks/new"><Plus className="size-4" />New task</Link></Button></div>
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="hidden grid-cols-[2fr_1.1fr_1fr_1fr_120px] gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted md:grid"><span>Task</span><span>Business</span><span>Priority</span><span>Status</span><span>Due</span></div>
      {tasks.length ? tasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}/edit`} className="grid gap-2 border-b border-border px-5 py-4 hover:bg-surface-muted/60 md:grid-cols-[2fr_1.1fr_1fr_1fr_120px] md:items-center md:gap-4">
        <span><span className="block text-sm font-medium">{task.title}</span><span className="mt-1 block text-xs text-text-muted">{task.type}</span></span>
        <span className="text-sm text-text-secondary">{task.business?.name ?? task.lead?.business?.name ?? "—"}</span>
        <Badge variant={task.priority === "URGENT" || task.priority === "HIGH" ? "danger" : "neutral"}>{task.priority}</Badge>
        <span className="text-sm text-text-secondary">{task.status}</span>
        <span className="text-xs text-text-muted">{task.due_at ? new Date(task.due_at).toLocaleString() : "No due date"}</span>
      </Link>) : <div className="px-6 py-12 text-center"><p className="font-medium">No tasks yet</p><p className="mt-1 text-sm text-text-secondary">Create a task when there is a concrete next step.</p></div>}
    </div>
  </div></AppShell>;
}
