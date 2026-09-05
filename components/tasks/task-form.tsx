"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTaskAction, updateTaskAction } from "@/app/actions/tasks";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
  type TaskInput,
  type TaskRecord,
} from "@/lib/domains/tasks/types";
import { Button } from "@/components/ui/button";

type BusinessOption = {
  id: string;
  name: string;
};

type LeadOption = {
  id: string;
  name: string;
  businessId: string;
};

type OpportunityOption = {
  id: string;
  name: string;
  leadId: string;
};

export function TaskForm({
  task,
  businessId,
  leadId,
  opportunityId,
  businesses = [],
  leads = [],
  opportunities = [],
}: {
  task?: TaskRecord;
  businessId?: string;
  leadId?: string;
  opportunityId?: string;
  businesses?: BusinessOption[];
  leads?: LeadOption[];
  opportunities?: OpportunityOption[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const [selectedBusinessId, setSelectedBusinessId] = useState(
    businessId ?? task?.business_id ?? "",
  );

  const [selectedLeadId, setSelectedLeadId] = useState(
    leadId ?? task?.lead_id ?? "",
  );

  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    opportunityId ?? task?.opportunity_id ?? "",
  );

  const filteredLeads = leads.filter(
    (lead) => lead.businessId === selectedBusinessId,
  );

  const filteredOpportunities = opportunities.filter(
    (opportunity) => opportunity.leadId === selectedLeadId,
  );

  function handleBusinessChange(value: string) {
    setSelectedBusinessId(value);
    setSelectedLeadId("");
    setSelectedOpportunityId("");
  }

  function handleLeadChange(value: string) {
    setSelectedLeadId(value);
    setSelectedOpportunityId("");
  }

  async function submit(formData: FormData) {
    setPending(true);
    setError("");

    try {
      if (
        !selectedBusinessId &&
        !selectedLeadId &&
        !selectedOpportunityId
      ) {
        throw new Error(
          "A task must be related to a business, lead, or opportunity.",
        );
      }

      const input: TaskInput = {
        business_id: selectedBusinessId || undefined,
        lead_id: selectedLeadId || undefined,
        opportunity_id: selectedOpportunityId || undefined,
        assigned_to: task?.assigned_to,
        type: formData.get("type") as TaskInput["type"],
        title: String(formData.get("title") || ""),
        description: String(formData.get("description") || ""),
        status: formData.get("status") as TaskInput["status"],
        priority: formData.get("priority") as TaskInput["priority"],
        due_at: formData.get("due_at")
          ? new Date(String(formData.get("due_at"))).toISOString()
          : null,
      };

      if (task) {
        await updateTaskAction(task.id, input);
      } else {
        await createTaskAction(input);
      }

      router.push("/tasks");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save task.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={submit}
      className="space-y-5 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      {error ? (
        <div className="rounded-md border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-lg border border-border bg-background p-4">
          <div className="mb-4">
            <div className="text-sm font-medium">Related to</div>
            <div className="text-xs text-text-secondary">
              Select a business first, then a lead, then an opportunity.
            </div>
          </div>

          <div className="space-y-4">
            {/* BUSINESS */}
            <label className="block space-y-2">
              <span className="block text-xs font-medium text-text-secondary">
                Business
              </span>

              <select
                name="business_id"
                value={selectedBusinessId}
                onChange={(e) => handleBusinessChange(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">Select a business...</option>

                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </label>

            {/* LEAD */}
            <label className="block space-y-2">
              <span className="block text-xs font-medium text-text-secondary">
                Lead
              </span>

              <select
                name="lead_id"
                value={selectedLeadId}
                onChange={(e) => handleLeadChange(e.target.value)}
                disabled={!selectedBusinessId}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">
                  {selectedBusinessId
                    ? "Select a lead..."
                    : "Select a business first"}
                </option>

                {filteredLeads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name}
                  </option>
                ))}
              </select>

              {selectedBusinessId && filteredLeads.length === 0 ? (
                <p className="text-xs text-text-secondary">
                  No leads are available for this business.
                </p>
              ) : null}
            </label>

            {/* OPPORTUNITY */}
            <label className="block space-y-2">
              <span className="block text-xs font-medium text-text-secondary">
                Opportunity
              </span>

              <select
                name="opportunity_id"
                value={selectedOpportunityId}
                onChange={(e) => setSelectedOpportunityId(e.target.value)}
                disabled={!selectedLeadId}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <option value="">
                  {selectedLeadId
                    ? "Select an opportunity..."
                    : "Select a lead first"}
                </option>

                {filteredOpportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.name}
                  </option>
                ))}
              </select>

              {selectedLeadId && filteredOpportunities.length === 0 ? (
                <p className="text-xs text-text-secondary">
                  No opportunities are available for this lead.
                </p>
              ) : null}
            </label>
          </div>
        </div>

        {/* TITLE */}
        <label className="space-y-2 sm:col-span-2">
          <span className="block text-xs font-medium text-text-secondary">
            Title
          </span>

          <input
            name="title"
            required
            defaultValue={task?.title ?? ""}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
            placeholder="Follow up about website proposal"
          />
        </label>

        {/* TYPE */}
        <label className="space-y-2">
          <span className="block text-xs font-medium text-text-secondary">
            Type
          </span>

          <select
            name="type"
            defaultValue={task?.type ?? "FOLLOW_UP"}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {TASK_TYPES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* PRIORITY */}
        <label className="space-y-2">
          <span className="block text-xs font-medium text-text-secondary">
            Priority
          </span>

          <select
            name="priority"
            defaultValue={task?.priority ?? "NORMAL"}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {TASK_PRIORITIES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* STATUS */}
        <label className="space-y-2">
          <span className="block text-xs font-medium text-text-secondary">
            Status
          </span>

          <select
            name="status"
            defaultValue={task?.status ?? "OPEN"}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {TASK_STATUSES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>

        {/* DUE */}
        <label className="space-y-2">
          <span className="block text-xs font-medium text-text-secondary">
            Due
          </span>

          <input
            name="due_at"
            type="datetime-local"
            defaultValue={task?.due_at ? task.due_at.slice(0, 16) : ""}
            className="h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>

        {/* DESCRIPTION */}
        <label className="space-y-2 sm:col-span-2">
          <span className="block text-xs font-medium text-text-secondary">
            Description
          </span>

          <textarea
            name="description"
            rows={4}
            defaultValue={task?.description ?? ""}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
      </div>

      <Button disabled={pending}>
        {pending ? "Saving..." : task ? "Save task" : "Create task"}
      </Button>
    </form>
  );
}