# P1-H — Activity + Task Domain

Date: 2026-08-22

## Scope

P1-H adds operational history and actionable work on top of the existing Business, Contact, Lead and Opportunity domains.

## Architectural distinction

- Activity = what happened.
- Task = what needs to happen.

Activities are immutable historical records. The database policy already prevents activity updates and deletes.

Tasks are mutable operational records and may be updated by organization members.

## Activity

Supported activity types match the existing P1-E database contract:

`CALL`, `EMAIL`, `WHATSAPP`, `MEETING`, `NOTE`, `STATUS_CHANGE`, `STAGE_CHANGE`, `TASK_COMPLETED`, `DEMO_SENT`, `PROPOSAL_SENT`, `PROPOSAL_VIEWED`, `PAYMENT`, `SYSTEM`.

Supported directions:

`INBOUND`, `OUTBOUND`, `INTERNAL`, `SYSTEM`.

Activities may relate to a Business, Lead, Contact or Opportunity. The service requires at least one related entity and records the acting user.

No edit or delete operation is exposed.

## Task

Task types used by the application:

`CALL`, `EMAIL`, `WHATSAPP`, `MEETING`, `FOLLOW_UP`, `RESEARCH`, `PROPOSAL`, `OTHER`.

Database statuses:

`OPEN`, `IN_PROGRESS`, `COMPLETED`, `DISMISSED`, `CANCELLED`.

Priorities:

`LOW`, `NORMAL`, `HIGH`, `URGENT`.

Tasks may relate to a Business, Lead or Opportunity. They support assignee, due time, description and completion timestamp.

## Routes

- `/activities`
- `/tasks`
- `/tasks/new`
- `/tasks/<id>/edit`

## Security

All mutations resolve the authenticated user and current organization before invoking domain services. Existing Supabase RLS remains the final tenant boundary.

## Explicit non-goals

- Gmail/WhatsApp/Calendar integrations
- automatic task generation
- AI
- scoring
- action-center ranking
- outbound messaging
- workflow automation

Those remain later phases.
