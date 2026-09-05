import type { MeetingListItem } from "@/lib/domains/meetings/types";
import type { OpportunityRecord } from "@/lib/domains/opportunities/types";
import type { TaskListItem } from "@/lib/domains/tasks/types";
import type { RecommendedAction } from "@/lib/domains/rules/types";

export type CommandCenterQueueItem = {
  id: string;
  kind: "RECOMMENDATION" | "TASK" | "MEETING" | "OPPORTUNITY";
  priority: "URGENT" | "HIGH" | "NORMAL" | "LOW";
  title: string;
  detail: string;
  href: string;
  dueAt: string | null;
};

export type CommandCenterData = {
  recommendations: RecommendedAction[];
  openLeadCount: number;
  openOpportunityCount: number;
  openPipelineValue: number;
  overdueTaskCount: number;
  dueTodayTaskCount: number;
  wonThisMonthCount: number;
  wonThisMonthValue: number;
  upcomingMeetings: MeetingListItem[];
  priorityTasks: TaskListItem[];
  priorityOpportunities: OpportunityRecord[];
  executionQueue: CommandCenterQueueItem[];
};
