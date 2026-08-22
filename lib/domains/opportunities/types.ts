export const OPPORTUNITY_STAGES = [
  "QUALIFIED",
  "CONTACTED",
  "CONNECTED",
  "INTERESTED",
  "DEMO",
  "PROPOSAL",
  "NEGOTIATION",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const OPPORTUNITY_STATUSES = ["OPEN", "WON", "LOST"] as const;
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export type OpportunityInput = {
  lead_id: string;
  name: string;
  value_amount?: number | null;
  currency?: string;
  probability?: number | null;
  expected_close_date?: string | null;
  stage?: OpportunityStage;
  status?: OpportunityStatus;
  owner_user_id?: string | null;
};

export type OpportunityRecord = OpportunityInput & {
  id: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};
