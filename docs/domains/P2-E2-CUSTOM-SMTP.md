# P2-E.2 — Universal Custom SMTP

## Purpose

Provide one provider-neutral outbound email integration that works with any compatible SMTP service.

## Supported configuration

- SMTP host
- Port
- STARTTLS
- Implicit TLS/SSL
- No TLS
- Username
- SMTP password/API key
- From name
- From email

## Security

The SMTP password/key is encrypted with AES-256-GCM before being stored in `organization_integrations.config_json`.

The encryption key is server-only:

`INTEGRATION_ENCRYPTION_KEY`

Normal integration listing queries explicitly omit `config_json`, so client components never receive the encrypted configuration.

The plaintext password/key is never returned after save.

## CRM behavior

A successful email sent from a Lead or Contact:

1. sends through Custom SMTP;
2. creates an immutable `EMAIL` Activity;
3. stores the provider message ID as `provider_event_id`;
4. associates the Activity with the Contact and Business;
5. associates the Activity with the Lead when a Lead context is supplied;
6. updates Lead `last_contacted_at` when a Lead context is supplied.

## Provider policy

Gmail and Microsoft Outlook are intentionally not implemented in this phase.

The SMTP adapter is vendor-neutral. Users can configure a compatible free or paid SMTP service without CRM code changes.

## Required environment variable

Generate a 32-byte random key and place its 64-character hex representation in:

`INTEGRATION_ENCRYPTION_KEY`

Example:

`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Do not commit this value.

## Verification

Run:

- `npm install`
- `npm run lint`
- `npm run build`
- apply the P2-E.2 migration
- configure SMTP
- Test connection
- send an email from a Lead
- verify Activity and `last_contacted_at`
