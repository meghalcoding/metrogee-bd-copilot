export const INTEGRATION_TYPES = ["EMAIL", "CALENDAR", "CALLING", "WHATSAPP", "ENRICHMENT", "LOCATION"] as const;
export type IntegrationType = (typeof INTEGRATION_TYPES)[number];

export const INTEGRATION_PROVIDERS = [
  "GMAIL",
  "MICROSOFT_OUTLOOK",
  "GOOGLE_CALENDAR",
  "MICROSOFT_CALENDAR",
  "TWILIO",
  "WHATSAPP_CLOUD",
  "GEOAPIFY",
  "FOURSQUARE",
  "MAPPLS",
  "OPENSTREETMAP",
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = ["DISCONNECTED", "CONNECTED", "ERROR", "DISABLED"] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export type IntegrationRecord = {
  id: string;
  organization_id: string;
  type: IntegrationType;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  display_name: string;
  enabled: boolean;
  config_json: Record<string, unknown>;
  last_used_at: string | null;
  last_error: string | null;
  connected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationDefinition = {
  provider: IntegrationProvider;
  type: IntegrationType;
  displayName: string;
  description: string;
  capabilities: string[];
  configuredByEnvironment?: boolean;
};
