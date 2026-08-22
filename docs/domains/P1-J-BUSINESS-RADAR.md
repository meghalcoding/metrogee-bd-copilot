# P1-J — Business Radar

Date: 2026-08-22

## Scope

P1-J turns existing Business, Lead, and Opportunity records into a deterministic Business Radar. The radar is a read-oriented prospecting and data-quality view; it does not introduce external discovery or AI.

## Signals

A business may receive one or more transparent signals:

- `NO_LEAD` — no active lead exists for the business.
- `WEBSITE_GAP` — website status is `WU` or `W0`.
- `CONTACT_GAP` — neither phone nor email is recorded.
- `QUALIFYING_LEAD` — the active lead is in `NEW` or `QUALIFYING`.
- `ACTIVE_OPPORTUNITY` — at least one OPEN opportunity exists through the business's lead.

Businesses are sorted by signal count and then name. No opaque score is stored.

## UX

Added `/radar` with:

- business count
- unworked-business count
- website-gap count
- contact-gap count
- open-opportunity count
- transparent signal badges
- direct links to the Business and Lead records

The existing sidebar destination `/radar` now resolves.

## Security

All reads use the authenticated user and current organization. Existing Supabase RLS remains the final tenant boundary.

## Explicit non-goals

- website scraping
- Google Places or other external discovery APIs
- AI scoring
- automatic lead creation
- automatic task creation
- outbound messaging
- predictive ranking

## Database decision

No migration is required. P1-J derives signals from existing `businesses`, `leads`, and `opportunities` records.
