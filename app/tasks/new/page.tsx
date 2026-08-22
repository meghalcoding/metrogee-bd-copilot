import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { TaskForm } from "@/components/tasks/task-form";

export default async function NewTaskPage({ searchParams }: { searchParams: Promise<{ business?: string; lead?: string; opportunity?: string }> }) {
  const params = await searchParams;
  return <AppShell><div className="mx-auto max-w-3xl space-y-6"><Link href="/tasks" className="text-sm font-medium text-text-secondary hover:text-foreground">← Tasks</Link><div><h1>New task</h1><p className="mt-2 text-sm text-text-secondary">Create one concrete action for the BD team.</p></div><TaskForm businessId={params.business} leadId={params.lead} opportunityId={params.opportunity} /></div></AppShell>;
}
