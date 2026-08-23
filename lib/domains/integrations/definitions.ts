import type { IntegrationDefinition, IntegrationProvider } from "./types";

export const INTEGRATION_DEFINITIONS: IntegrationDefinition[] = [
  {
    provider: "GMAIL",
    type: "EMAIL",
    displayName: "Gmail",
    description: "Send and track BD email from the CRM.",
    capabilities: ["Send email", "Record email activity"],
  },
  {
    provider: "MICROSOFT_OUTLOOK",
    type: "EMAIL",
    displayName: "Microsoft Outlook",
    description: "Connect Microsoft 365 mail for CRM email workflows.",
    capabilities: ["Send email", "Record email activity"],
  },
  {
    provider: "GOOGLE_CALENDAR",
    type: "CALENDAR",
    displayName: "Google Calendar",
    description: "Create and synchronize meetings from CRM records.",
    capabilities: ["Create events", "Record meetings"],
  },
  {
    provider: "MICROSOFT_CALENDAR",
    type: "CALENDAR",
    displayName: "Microsoft Calendar",
    description: "Connect Microsoft 365 calendar for CRM scheduling.",
    capabilities: ["Create events", "Record meetings"],
  },
  {
    provider: "TWILIO",
    type: "CALLING",
    displayName: "Twilio",
    description: "Foundation for click-to-call and call outcome recording.",
    capabilities: ["Initiate calls", "Record call outcomes"],
  },
  {
    provider: "WHATSAPP_CLOUD",
    type: "WHATSAPP",
    displayName: "WhatsApp Cloud API",
    description: "Foundation for CRM-controlled WhatsApp messaging.",
    capabilities: ["Send messages", "Record message activity"],
  },
  {
    provider: "GEOAPIFY",
    type: "ENRICHMENT",
    displayName: "Geoapify",
    description: "Prospecting and business enrichment provider.",
    capabilities: ["Place search", "Business enrichment"],
    configuredByEnvironment: true,
  },
  {
    provider: "FOURSQUARE",
    type: "ENRICHMENT",
    displayName: "Foursquare",
    description: "Global place search and enrichment provider.",
    capabilities: ["Place search", "Business enrichment"],
    configuredByEnvironment: true,
  },
  {
    provider: "MAPPLS",
    type: "ENRICHMENT",
    displayName: "Mappls",
    description: "India-focused location and place provider.",
    capabilities: ["Place search", "Business enrichment"],
    configuredByEnvironment: true,
  },
  {
    provider: "OPENSTREETMAP",
    type: "LOCATION",
    displayName: "OpenStreetMap",
    description: "Open geographic data used by prospecting and location workflows.",
    capabilities: ["Place discovery", "Geocoding"],
  },
];

export function getIntegrationDefinition(provider: IntegrationProvider) {
  return INTEGRATION_DEFINITIONS.find((item) => item.provider === provider);
}
