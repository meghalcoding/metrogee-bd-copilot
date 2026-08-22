# P1-LIFECYCLE — CRM Lifecycle Correction

## Lead lifecycle

Lead stages now describe the customer relationship only:

`NEW → QUALIFYING → QUALIFIED → CONTACTED → CONNECTED → INTERESTED`

`NURTURE` is a relationship branch that can be revisited later.

Lead `WON` and `LOST` stages are removed. Deal outcomes belong to opportunities. Lead operational `status` remains separate and can be `ACTIVE`, `PAUSED`, `ON_HOLD`, `CLOSED` or `ARCHIVED`.

Lead stage corrections are intentionally reversible. The domain no longer forces one-way progression, so a BD user can correct a stage mistake directly. Every change is still recorded in `lead_stage_history`.

## Opportunity lifecycle

An opportunity is a specific commercial deal attached to a qualified lead.

`DISCOVERY → SOLUTIONING → PROPOSAL → NEGOTIATION → CONTRACTING → DELIVERY`

The opportunity can be explicitly closed from its record at any point as:

- `WON` — deal completed/closed successfully.
- `LOST` — deal did not close; a reason is required.

`OPEN` and `ON_HOLD` remain operational statuses. Closed opportunities remain records and can be reopened through the edit form if they were recorded incorrectly.

Opportunity stage changes are reversible and recorded in `opportunity_stage_history`.

## Guided opportunity creation

Creating an opportunity requires a lead with `qualification_status = QUALIFIED`. If the user tries to create an opportunity too early, the application no longer throws a dead-end error. It explains the prerequisite, links directly to Lead Edit, and passes a `returnTo` URL so saving the lead brings the user back to Opportunity creation.

This keeps the database rule intact while moving the protocol burden from the BD user into the application flow.
