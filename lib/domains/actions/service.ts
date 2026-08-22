import { listTasks } from "@/lib/domains/tasks/service";
import { listRecommendedActions } from "@/lib/domains/rules/service";
import type { ActionCenterData } from "./types";

function dayStart(date: Date) { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; }
function dayEnd(date: Date) { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; }

export async function getActionCenterData(organizationId: string): Promise<ActionCenterData> {
  const [tasks, recommendations] = await Promise.all([
    listTasks(organizationId),
    listRecommendedActions(organizationId),
  ]);
  const openTasks = tasks.filter((task) => task.status === "OPEN" || task.status === "IN_PROGRESS");
  const now = new Date();
  const today = dayStart(now);
  const endToday = dayEnd(now);
  return {
    recommendations,
    openTaskCount: openTasks.length,
    overdueTaskCount: openTasks.filter((task) => task.due_at && new Date(task.due_at) < now).length,
    dueTodayTaskCount: openTasks.filter((task) => task.due_at && new Date(task.due_at) >= today && new Date(task.due_at) <= endToday).length,
    highPriorityTaskCount: openTasks.filter((task) => task.priority === "HIGH" || task.priority === "URGENT").length,
  };
}
