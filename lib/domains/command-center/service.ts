import { listMeetings } from "@/lib/domains/meetings/service";
import { listLeads } from "@/lib/domains/leads/service";
import { listOpportunities } from "@/lib/domains/opportunities/service";
import { listTasks } from "@/lib/domains/tasks/service";
import { listRecommendedActions } from "@/lib/domains/rules/service";
import type { CommandCenterData } from "./types";
import type { TaskPriority } from "@/lib/domains/tasks/types";

function dayStart(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function dayEnd(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getCommandCenterData(organizationId: string): Promise<CommandCenterData> {
  const [leads, opportunities, tasks, meetings, recommendations] = await Promise.all([
    listLeads(organizationId),
    listOpportunities(organizationId),
    listTasks(organizationId),
    listMeetings(organizationId, { upcomingOnly: true }),
    listRecommendedActions(organizationId),
  ]);

  const now = new Date();
  const today = dayStart(now);
  const endToday = dayEnd(now);
  const startOfMonth = monthStart(now);
  const openTasks = tasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS");
  const openOpportunities = opportunities.filter((opportunity) => opportunity.status === "OPEN");
  const wonThisMonth = opportunities.filter((opportunity) => {
    if (opportunity.status !== "WON") return false;
    const closedAt = opportunity.closed_at ? new Date(opportunity.closed_at) : null;
    return Boolean(closedAt && closedAt >= startOfMonth && closedAt <= now);
  });

  const priorityTaskIds = new Set(
    openTasks
      .filter((task) => task.priority === "URGENT" || task.priority === "HIGH" || (task.due_at && new Date(task.due_at) <= endToday))
      .sort((a, b) => {
        const priority: Record<TaskPriority, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
        return priority[b.priority as TaskPriority] - priority[a.priority as TaskPriority] || (a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER) - (b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER);
      })
      .slice(0, 6)
      .map((task) => task.id),
  );

  const priorityTasks = openTasks.filter((task) => priorityTaskIds.has(task.id));
  const priorityOpportunities = [...openOpportunities]
    .sort((a, b) => (b.probability ?? 0) - (a.probability ?? 0) || (b.value_amount ?? 0) - (a.value_amount ?? 0))
    .slice(0, 5);

  const executionQueue = [
    ...recommendations.slice(0, 4).map((action) => ({
      id: `recommendation:${action.id}`,
      kind: "RECOMMENDATION" as const,
      priority: action.priority,
      title: action.title,
      detail: action.reason,
      href: action.href ?? "/actions",
      dueAt: action.dueAt ?? null,
    })),
    ...priorityTasks.slice(0, 4).map((task) => ({
      id: `task:${task.id}`,
      kind: "TASK" as const,
      priority: task.priority as TaskPriority,
      title: task.title,
      detail: task.business?.name ?? task.lead?.business?.name ?? task.opportunity?.name ?? "CRM task",
      href: `/tasks/${task.id}/edit`,
      dueAt: task.due_at ?? null,
    })),
    ...meetings.slice(0, 3).map((meeting) => ({
      id: `meeting:${meeting.id}`,
      kind: "MEETING" as const,
      priority: "NORMAL" as const,
      title: meeting.title,
      detail: meeting.business?.name ?? meeting.lead?.business?.name ?? "CRM meeting",
      href: `/meetings/${meeting.id}`,
      dueAt: meeting.start_at,
    })),
    ...priorityOpportunities.slice(0, 3).map((opportunity) => ({
      id: `opportunity:${opportunity.id}`,
      kind: "OPPORTUNITY" as const,
      priority: (opportunity.probability ?? 0) >= 75 ? "HIGH" as const : "NORMAL" as const,
      title: `Follow up: ${opportunity.name}`,
      detail: `${opportunity.stage} · ${opportunity.probability ?? 0}% probability`,
      href: `/opportunities/${opportunity.id}`,
      dueAt: opportunity.expected_close_date ? `${opportunity.expected_close_date}T23:59:59` : null,
    })),
  ]
    .sort((a, b) => {
      const priority: Record<TaskPriority, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
      return priority[b.priority] - priority[a.priority] ||
        (a.dueAt ? new Date(a.dueAt).getTime() : Number.MAX_SAFE_INTEGER) -
        (b.dueAt ? new Date(b.dueAt).getTime() : Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 10);

  return {
    recommendations,
    openLeadCount: leads.filter((lead) => ["ACTIVE", "PAUSED", "ON_HOLD"].includes(lead.status ?? "ACTIVE")).length,
    openOpportunityCount: openOpportunities.length,
    openPipelineValue: openOpportunities.reduce((sum, opportunity) => sum + (opportunity.value_amount ?? 0), 0),
    overdueTaskCount: openTasks.filter((task) => task.due_at && new Date(task.due_at) < now).length,
    dueTodayTaskCount: openTasks.filter((task) => task.due_at && new Date(task.due_at) >= today && new Date(task.due_at) <= endToday).length,
    wonThisMonthCount: wonThisMonth.length,
    wonThisMonthValue: wonThisMonth.reduce((sum, opportunity) => sum + (opportunity.value_amount ?? 0), 0),
    upcomingMeetings: meetings.slice(0, 5),
    priorityTasks,
    priorityOpportunities,
    executionQueue,
  };
}
