# P2-E.4 — Calling and WhatsApp

## Scope

P2-E.4 adds usable communication actions without requiring a paid calling or WhatsApp API.

### Calling

- Contact phone numbers expose a native `tel:` action.
- The BD can record a call outcome against the Contact and optional Lead.
- Call outcomes are stored as immutable `CALL` activities.
- When a Lead is supplied, `last_contacted_at` is updated.

### WhatsApp

- Contact WhatsApp numbers expose a `wa.me` action.
- The BD can record a WhatsApp outcome against the Contact and optional Lead.
- WhatsApp outcomes are stored as immutable `WHATSAPP` activities.
- When a Lead is supplied, `last_contacted_at` is updated.

## Provider strategy

P2-E.4 does not require Twilio or WhatsApp Cloud credentials.

The native `tel:` and `wa.me` paths make the core workflow usable immediately. The existing provider-neutral integration registry remains available for future API-controlled calling/messaging.

## Outcomes

Call:
- Connected
- No answer
- Busy
- Voicemail
- Wrong number
- Callback requested
- Not interested

WhatsApp:
- Sent
- Delivered
- Replied
- No response
- Wrong number

## Database

No migration is required. Existing `activities` support `CALL` and `WHATSAPP`.

## Verification

Run `npm run lint` and `npm run build`, then test Contact and Lead communication actions and verify the resulting activities and Lead `last_contacted_at`.
