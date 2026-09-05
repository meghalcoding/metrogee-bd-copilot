import Link from "next/link";
import { AlertCircle, CheckSquare, Clock3, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/require-user";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { listTasks } from "@/lib/domains/tasks/service";

function isOverdue(due: string | null) {
  if (!due) return false;
  return new Date(due) < new Date();
}

export default async function TasksPage() {
  await requireUser();
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const tasks = await listTasks(organization.id);

  const open = tasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS");
  const overdue = open.filter((t) => isOverdue(t.due_at ?? null));
  const done = tasks.filter((t) => t.status === "DONE" || t.status === "CANCELLED");

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">CRM</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="mt-1.5 text-sm text-text-secondary">
              {tasks.length > 0
                ? `${open.length} open · ${overdue.length > 0 ? `${overdue.length} overdue · ` : ""}${done.length} completed`
                : "Actionable work for the BD team."}
            </p>
          </div>
          <Button asChild>
            <Link href="/tasks/new"><Plus className="size-4" />New task</Link>
          </Button>
        </div>

        {/* Overdue callout */}
        {overdue.length > 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">{overdue.length} overdue task{overdue.length > 1 ? "s" : ""}</p>
              <p className="mt-0.5 text-xs text-danger/80">
                {overdue.map((t) => t.title).slice(0, 3).join(", ")}
                {overdue.length > 3 ? ` and ${overdue.length - 3} more` : ""}
              </p>
            </div>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-5 py-16 text-center">
            <CheckSquare className="mb-3 size-10 text-text-muted" strokeWidth={1.2} />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="mt-1 max-w-xs text-sm text-text-secondary">
              Create a task when there is a concrete next step for a lead or business.
            </p>
            <Button asChild className="mt-5" size="sm">
              <Link href="/tasks/new">Create first task</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {open.length > 0 && <TaskTable title="Open" count={open.length} tasks={open} />}
            {done.length > 0 && <TaskTable title="Completed" count={done.length} tasks={done} muted />}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TaskTable({
  title,
  count,
  tasks,
  muted,
}: {
  title: string;
  count: number;
  tasks: Awaited<ReturnType<typeof listTasks>>;
  muted?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-muted/40 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h2>
        <Badge variant="neutral">{count}</Badge>
      </div>
      <div className="hidden grid-cols-[2fr_1.1fr_100px_100px_130px] gap-4 border-b border-border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted md:grid">
        <span>Task</span>
        <span>Business</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Due</span>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const overdue = isOverdue(task.due_at ?? null) && task.status !== "DONE" && task.status !== "CANCELLED";
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}/edit`}
              className={`group grid gap-2 px-5 py-4 transition-colors hover:bg-surface-muted/50 md:grid-cols-[2fr_1.1fr_100px_100px_130px] md:items-center md:gap-4 ${muted ? "opacity-60 hover:opacity-100" : ""}`}
            >
              <div className="min-w-0">
                <span className="block text-sm font-medium text-foreground transition-colors group-hover:text-primary truncate">
                  {task.title}
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">{task.type}</span>
              </div>
              <span className="truncate text-sm text-text-secondary">
                {task.business?.name ?? task.lead?.business?.name ?? <span className="text-text-muted">—</span>}
              </span>
              <div>
                <Badge
                  variant={
                    task.priority === "URGENT" || task.priority === "HIGH"
                      ? "danger"
                      : task.priority === "MEDIUM"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {task.priority}
                </Badge>
              </div>
              <span className="text-sm text-text-secondary">{task.status}</span>
              <div className="flex items-center gap-1.5">
                {overdue && <Clock3 className="size-3.5 shrink-0 text-danger" />}
                <span className={`text-xs ${overdue ? "font-semibold text-danger" : "text-text-muted"}`}>
                  {task.due_at
                    ? new Date(task.due_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : "No due date"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
