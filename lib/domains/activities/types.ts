export const ACTIVITY_TYPES = [
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "MEETING",
  "NOTE",
  "STATUS_CHANGE",
  "STAGE_CHANGE",
  "TASK_COMPLETED",
  "DEMO_SENT",
  "PROPOSAL_SENT",
  "PROPOSAL_VIEWED",
  "PAYMENT",
  "SYSTEM",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_DIRECTIONS = ["INBOUND", "OUTBOUND", "INTERNAL", "SYSTEM"] as const;
export type ActivityDirection = (typeof ACTIVITY_DIRECTIONS)[number];

export type ActivityInput = {
  business_id?: string | null;
  lead_id?: string | null;
  contact_id?: string | null;
  opportunity_id?: string | null;
  user_id?: string | null;
  type: ActivityType;
  direction?: ActivityDirection | null;
  subject?: string | null;
  body_preview?: string | null;
  occurred_at?: string;
  provider?: string | null;
  provider_event_id?: string | null;
  metadata_json?: Record<string, unknown>;
};

export type ActivityRecord = ActivityInput & {
  id: string;
  organization_id: string;
  occurred_at: string;
  created_at: string;
};
