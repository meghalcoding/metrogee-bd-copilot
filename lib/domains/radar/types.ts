import type { WebsiteStatus } from "@/lib/domains/businesses/types";

export type RadarSignal =
  | "NO_LEAD"
  | "WEBSITE_GAP"
  | "CONTACT_GAP"
  | "QUALIFYING_LEAD"
  | "ACTIVE_OPPORTUNITY";

export type RadarBusiness = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  website_status: WebsiteStatus;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  review_count: number | null;
  lead_id: string | null;
  lead_stage: string | null;
  open_opportunity_count: number;
  signals: RadarSignal[];
  signal_count: number;
};

export type RadarSummary = {
  businesses: number;
  unworked: number;
  websiteGaps: number;
  contactGaps: number;
  qualifyingLeads: number;
  activeOpportunities: number;
};
