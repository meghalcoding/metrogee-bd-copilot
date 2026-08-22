export const TASK_TYPES = [
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "MEETING",
  "FOLLOW_UP",
  "RESEARCH",
  "PROPOSAL",
  "OTHER",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "DISMISSED", "CANCELLED"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type TaskInput = {
  business_id?: string | null;
  lead_id?: string | null;
  opportunity_id?: string | null;
  assigned_to?: string | null;
  type: TaskType;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_at?: string | null;
  source_rule_id?: string | null;
};

export type TaskRecord = TaskInput & {
  id: string;
  organization_id: string;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskListItem = TaskRecord & {
  business: { name: string } | null;
  lead: { id: string; stage: string; business: { name: string } | null } | null;
};
