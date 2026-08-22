import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { TaskForm } from "@/components/tasks/task-form";
import { getCurrentOrganization } from "@/lib/domains/organizations/current";
import { getTask } from "@/lib/domains/tasks/service";
import { requireUser } from "@/lib/auth/require-user";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const organization = await getCurrentOrganization();
  if (!organization) return null;
  const task = await getTask(organization.id, id);
  if (!task) notFound();
  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><Link href="/tasks" className="text-sm font-medium text-text-secondary hover:text-foreground">← Tasks</Link><div><h1>Edit task</h1><p className="mt-2 text-sm text-text-secondary">Update the action, priority, timing or completion state.</p></div><TaskForm task={task} /></div></AppShell>;
}
