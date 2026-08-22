"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTaskAction, updateTaskAction } from "@/app/actions/tasks";
import { TASK_PRIORITIES, TASK_STATUSES, TASK_TYPES, type TaskInput, type TaskRecord } from "@/lib/domains/tasks/types";
import { Button } from "@/components/ui/button";

export function TaskForm({
  task,
  businessId,
  leadId,
  opportunityId,
}: {
  task?: TaskRecord;
  businessId?: string;
  leadId?: string;
  opportunityId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const input: TaskInput = {
        business_id: businessId ?? task?.business_id,
        lead_id: leadId ?? task?.lead_id,
        opportunity_id: opportunityId ?? task?.opportunity_id,
        assigned_to: task?.assigned_to,
        type: formData.get("type") as TaskInput["type"],
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        status: formData.get("status") as TaskInput["status"],
        priority: formData.get("priority") as TaskInput["priority"],
        due_at: formData.get("due_at") ? new Date(String(formData.get("due_at"))).toISOString() : null,
      };
      if (task) await updateTaskAction(task.id, input);
      else await createTaskAction(input);
      router.push("/tasks");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save task.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} className="space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6">
      {error ? <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 sm:col-span-2"><span className="block text-xs font-medium text-text-secondary">Title</span><input name="title" required defaultValue={task?.title ?? ""} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" placeholder="Follow up about website proposal" /></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Type</span><select name="type" defaultValue={task?.type ?? "FOLLOW_UP"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{TASK_TYPES.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Priority</span><select name="priority" defaultValue={task?.priority ?? "NORMAL"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{TASK_PRIORITIES.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Status</span><select name="status" defaultValue={task?.status ?? "OPEN"} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">{TASK_STATUSES.map((v) => <option key={v}>{v}</option>)}</select></label>
        <label className="space-y-2"><span className="block text-xs font-medium text-text-secondary">Due</span><input name="due_at" type="datetime-local" defaultValue={task?.due_at ? task.due_at.slice(0,16) : ""} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm" /></label>
        <label className="space-y-2 sm:col-span-2"><span className="block text-xs font-medium text-text-secondary">Description</span><textarea name="description" rows={4} defaultValue={task?.description ?? ""} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
      </div>
      <Button disabled={pending}>{pending ? "Saving…" : task ? "Save task" : "Create task"}</Button>
    </form>
  );
}
