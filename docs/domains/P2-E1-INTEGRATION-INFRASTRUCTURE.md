# P2-E.1 — Integration Infrastructure

## Purpose

Create a provider-neutral integration registry before implementing individual external service workflows.

## Scope

- Organization-level integration registry.
- Provider/type/capability definitions.
- Connected, disabled, disconnected and error states.
- Integration settings UI at `/integrations`.
- Server-side mutations for enabling/disabling/disconnecting providers.
- No provider OAuth tokens are stored in the integration registry.
- Provider-specific authentication and API operations are deferred to later phases.

## Providers registered

- Gmail
- Microsoft Outlook
- Google Calendar
- Microsoft Calendar
- Twilio
- WhatsApp Cloud API
- Geoapify
- Foursquare
- Mappls
- OpenStreetMap

The registry does not imply that credentials or provider APIs are active. A connection record means the workspace has registered that provider for future use.

## Security rule

Secrets and OAuth tokens must not be exposed through the integration settings UI or stored as ordinary CRM fields. Provider-specific authentication storage will be designed when each integration is implemented.

## Database

Adds `organization_integrations` with organization-scoped RLS and a unique `(organization_id, provider)` constraint.

## Verification

Run:

- `npm run lint`
- `npm run build`
- Open `/integrations`
- Enable a provider and confirm its state persists.
- Disable/disconnect it and confirm the state changes.
- Confirm existing CRM workflows continue to operate independently.
