export const MEETING_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export type MeetingInput = {
  business_id?: string | null;
  lead_id?: string | null;
  contact_id?: string | null;
  opportunity_id?: string | null;
  title: string;
  description?: string | null;
  location?: string | null;
  start_at: string;
  end_at: string;
  timezone?: string | null;
};

export type MeetingRecord = MeetingInput & {
  id: string;
  organization_id: string;
  status: MeetingStatus;
  provider: string;
  external_event_id: string | null;
  external_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingListItem = MeetingRecord & {
  business: { id: string; name: string } | null;
  lead: { id: string; stage: string; business: { name: string } | null } | null;
  contact: { id: string; full_name: string; email: string | null } | null;
  opportunity: { id: string; name: string; stage: string; status: string } | null;
};
