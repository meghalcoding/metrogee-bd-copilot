# P1-G — Lead + Opportunity Domain

## Scope

This phase turns Businesses and Contacts into an organization-specific sales workflow without introducing communications, scoring automation, AI, or external integrations.

## Lead

- Business relationship is separate from the Business record.
- One active lead per business per organization.
- Lead stage and operational status are separate.
- Stage transitions are centralized and validated.
- Lost leads require a lost reason.
- Stage changes write append-only `lead_stage_history` records.
- Soft archive is supported.
- Opportunity and priority scores are stored but not calculated here; P1-K owns the deterministic scoring engine.

## Lead stages

`NEW → QUALIFYING → QUALIFIED → CONTACTED → CONNECTED → INTERESTED → DEMO → PROPOSAL → NEGOTIATION → WON/LOST`

`NURTURE` is an explicit lifecycle branch and can return to `QUALIFYING`.

## Opportunity

- Belongs to a Lead.
- Requires a qualified lead before creation.
- Has value, currency, probability, expected close date, pipeline stage, owner and status.
- Stage transitions are centralized.
- Closed opportunities receive `closed_at`.
- Reopening a closed opportunity is intentionally deferred from P1-G.

## Application routes

- `/leads`
- `/leads/new?business=<id>`
- `/leads/<id>`
- `/leads/<id>/edit`
- `/opportunities/new?lead=<id>`
- `/opportunities/<id>`
- `/opportunities/<id>/edit`

## Explicit non-goals

- AI scoring
- automatic scoring calculation
- Gmail/WhatsApp/Calendar
- automated next-best-action generation
- bulk outbound messaging
- pipeline analytics

Those belong to later locked phases.
