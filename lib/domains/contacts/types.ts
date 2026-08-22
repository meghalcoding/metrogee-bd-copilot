export const CONTACT_CHANNELS = ["PHONE", "EMAIL", "WHATSAPP", "OTHER"] as const;
export type ContactChannel = (typeof CONTACT_CHANNELS)[number];

export type ContactInput = {
  first_name?: string | null;
  last_name?: string | null;
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp_phone?: string | null;
  preferred_channel?: ContactChannel | null;
  source?: string | null;
};

export type ContactRecord = ContactInput & {
  id: string;
  organization_id: string;
  business_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
