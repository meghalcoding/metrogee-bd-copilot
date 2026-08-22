export const LEAD_STAGES = [
  "NEW",
  "QUALIFYING",
  "QUALIFIED",
  "CONTACTED",
  "CONNECTED",
  "INTERESTED",
  "NURTURE",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_STATUSES = ["ACTIVE", "PAUSED", "ON_HOLD", "CLOSED", "ARCHIVED"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const QUALIFICATION_STATUSES = ["UNQUALIFIED", "QUALIFYING", "QUALIFIED", "DISQUALIFIED"] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export type LeadInput = {
  business_id: string;
  primary_contact_id?: string | null;
  owner_user_id?: string | null;
  stage?: LeadStage;
  status?: LeadStatus;
  source?: string | null;
  qualification_status?: QualificationStatus;
  opportunity_score?: number | null;
  priority_score?: number | null;
  next_action_at?: string | null;
};

export type LeadRecord = LeadInput & {
  id: string;
  organization_id: string;
  last_contacted_at: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LeadListItem = LeadRecord & {
  business: { name: string } | null;
  primary_contact: { full_name: string } | null;
};
