# P1-K / P1-L / P1-M — Scoring, Rules and Action Center

## Scope

This batch implements the deterministic execution layer described by the Phase 1 architecture:

- P1-K: explainable lead scoring
- P1-L: deterministic next-best-action rules
- P1-M: Action Center presentation of recommendations alongside committed tasks

## Scoring

The score is computed from current CRM state and is not persisted. Factors include business rating and review volume, website gap, contactability, lead stage, qualification status, stored opportunity/priority scores, recorded contact state and open opportunity presence.

The score is clamped to 0–100 and each contribution has a human-readable explanation.

## Rules

Initial rules include:

- `NPA-CONTACT-001` — qualified lead with no recorded contact
- `NPA-FOLLOWUP-001` — scheduled next action is overdue
- `NPA-QUALIFY-001` — new/qualifying lead with website gap
- `NPA-NEXT-001` — later-stage lead without an open task
- `NPA-OPPORTUNITY-001` — open opportunity approaching expected close
- `NPA-TASK-001` — overdue task

Each recommendation contains its rule ID, reason, due time, score where applicable and source record IDs.

## Action semantics

A recommendation is **not** a task. The engine never creates tasks automatically. A task remains an explicit user commitment.

The Action Center now presents deterministic recommendations first, followed by committed tasks grouped by timing.

## Architecture constraints

- No AI.
- No external integrations.
- No new database tables or migrations.
- Shared domain services are used from application entry points.
- Recommendations are explainable and deterministic.
