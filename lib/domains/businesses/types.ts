export const WEBSITE_STATUSES = ["WU", "W0", "W1", "W2", "W3", "W4"] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export type BusinessInput = {
  name: string;
  legal_name?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website_url?: string | null;
  website_status?: WebsiteStatus;
  primary_category_id?: string | null;
  rating?: number | null;
  review_count?: number | null;
  source_primary?: string | null;
  source_last_synced_at?: string | null;
  metadata_json?: Record<string, unknown>;
};

export type BusinessRecord = BusinessInput & {
  id: string;
  organization_id: string;
  normalized_name: string;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type BusinessListFilters = {
  search?: string;
  website_status?: WebsiteStatus;
  category_id?: string;
  city?: string;
};
