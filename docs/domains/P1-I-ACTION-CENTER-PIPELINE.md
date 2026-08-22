# P1-I — Action Center + Pipeline Foundation

Date: 2026-08-22

## Scope

P1-I turns the verified P1-G Opportunity and P1-H Task domains into an operational workflow layer.

## Action Center

`/actions` consumes existing Tasks and presents deterministic work buckets:

- Overdue
- Due today
- Upcoming
- No due date

High and urgent tasks are surfaced as a transparent count. Users can complete an open task directly from the Action Center.

The Action Center does not create tasks, infer intent, use AI, or call external systems.

## Pipeline

`/pipeline` displays OPEN opportunities grouped by the existing P1-G stages:

`QUALIFIED → CONTACTED → CONNECTED → INTERESTED → DEMO → PROPOSAL → NEGOTIATION`

Each opportunity can be advanced one valid stage at a time. The domain service remains the authority for transition validity. WON/LOST closure remains available from the Opportunity record.

## Security

All reads and mutations continue through the authenticated user and current organization. Existing Supabase RLS remains the final tenant boundary.

## Explicit non-goals

- AI action ranking
- automatic task generation
- outbound messaging
- Gmail/WhatsApp/Calendar integrations
- predictive scoring
- drag-and-drop stage mutation

## Verification

Required before phase completion:

1. `npm run lint`
2. `npm run build`
3. `/actions` loads and displays real tasks
4. Completing a task from `/actions` works
5. `/pipeline` loads real open opportunities
6. Advancing an opportunity moves it exactly one permitted stage
7. Existing Lead, Opportunity and Task workflows remain functional
