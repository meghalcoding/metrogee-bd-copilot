# Metrogee BD Copilot — Master Intelligence

## Canonical status

This file is the repository-level continuity document for architecture, phase decisions, implementation history and verified checkpoints.

The repository currently contains phase-specific source documents under `docs/`. This Master Intelligence was introduced as a tracked file during P1-H because no repository-level Master Intelligence file existed in the supplied P1-H source checkpoint.

## Current phase

**P1-J — Business Radar**

### Verified preceding phases

- P1-D — Organizations / RLS
- P1-D2 — Organization onboarding
- P1-E — Core CRM schema
- P1-E2 — Database verification
- P1-F — Business + Contact domain
- P1-G — Lead + Opportunity domain

P1-G was verified locally by the user with both `npm run lint` and `npm run build`.

## Locked product principles

- No AI features.
- Core CRM must function without external integrations.
- Domain services sit behind application mutations.
- Organization isolation is mandatory.
- Business is a factual long-lived entity.
- Lead represents the sales relationship.
- Opportunity represents a concrete commercial opportunity.
- Activity records what happened.
- Task records what needs to happen.
- Activities are append-only/immutable.
- Tasks are mutable operational records.
- External integrations are later phases, not prerequisites for the core CRM.

## P1-H change record

### Implementation

Added:

- `lib/domains/activities/types.ts`
- `lib/domains/activities/service.ts`
- `lib/domains/tasks/types.ts`
- `lib/domains/tasks/service.ts`
- `app/actions/activities.ts`
- `app/actions/tasks.ts`
- `components/activities/activity-form.tsx`
- `components/tasks/task-form.tsx`
- `app/activities/page.tsx`
- `app/tasks/page.tsx`
- `app/tasks/new/page.tsx`
- `app/tasks/[id]/edit/page.tsx`
- `docs/domains/P1-H-ACTIVITY-TASK-DOMAIN.md`

### Database decision

No new migration is required for P1-H because the supplied P1-E migration already creates `activities` and `tasks` and already defines their RLS behavior.

Activities:
- insert allowed to organization members
- update denied
- delete denied

Tasks:
- insert/update allowed to organization members
- delete restricted to owner/admin/manager

### Verification state

The supplied source checkpoint was used as the implementation basis.

Local lint/build verification must be performed in the user's Windows repository after applying this checkpoint.

## Known development history

P1-G required several TypeScript corrections around optional literal-union input properties. The final fix used `NonNullable<>` to preserve strict domain typing. The user verified the resulting build successfully.

A GitHub repository was established for the project after removing `node_modules` and `.next` from Git history. The active branch is `phase-1b-design-system`.

## P1-I change record

### Scope

P1-I adds the operational layer over the verified Opportunity and Task domains.

Added:

- `/actions` deterministic Action Center
- `/pipeline` open-opportunity pipeline view
- deterministic task buckets: overdue, due today, upcoming and no due date
- task completion directly from Action Center
- sequential Opportunity stage advancement using the existing P1-G transition contract
- opportunity context on task listings
- Pipeline and Action Center navigation destinations now resolve instead of returning 404

### Rules

- Action Center consumes existing Tasks; it does not generate tasks automatically.
- Action prioritization is deterministic and transparent.
- Pipeline only shows OPEN opportunities.
- Opportunity stage movement remains constrained by P1-G allowed transitions.
- WON/LOST closure remains on the Opportunity record.
- No AI, scoring, messaging or external integration is introduced.

### Verification state

P1-I implementation checkpoint prepared against the P1-H source snapshot. Local lint, build and functional verification are required before marking P1-I complete.

## Next phase

After P1-I lint/build and functional verification pass, proceed to the next CRM capability defined by the project roadmap.


## Continuity protocol

For every subsequent implementation prompt:

1. Read this file first.
2. Read the relevant phase document(s).
3. Inspect the current source before modifying it.
4. Record the change in this file.
5. Preserve the locked architecture unless the user explicitly changes it.
6. Do not mark a phase complete until local lint/build and required functional checks pass.


## P1-J change record

### Scope

P1-J adds a deterministic Business Radar over the existing Business, Lead, and Opportunity domains.

Added:

- `/radar` Business Radar page
- `lib/domains/radar/types.ts`
- `lib/domains/radar/service.ts`
- `docs/domains/P1-J-BUSINESS-RADAR.md`

### Rules

Radar signals are transparent and derived only from existing CRM data:

- no active lead
- website status `WU` or `W0`
- missing both phone and email
- lead in `NEW` or `QUALIFYING`
- one or more OPEN opportunities

No opaque score is persisted. No external discovery, scraping, AI, lead generation, or task generation is introduced.

### Database decision

No migration is required.

### Verification state

P1-J implementation checkpoint prepared from the verified P1-I source snapshot. Local lint, build and functional verification are required before marking P1-J complete.


## P1-K through P1-M change record

### Scope

Implemented the deterministic BD execution layer in one compatible batch:

- P1-K explainable scoring engine under `lib/domains/scoring`
- P1-L deterministic next-best-action rules under `lib/domains/rules`
- P1-M Action Center upgraded to show recommendations alongside committed tasks
- lead detail now shows computed score and factor explanations
- Action Center recommendations expose rule ID, reason, due time and source records

### Rules

- Scores are computed from current CRM state and are not persisted.
- Recommendations are deterministic and explainable.
- Recommendations never auto-create tasks.
- Existing tasks remain explicit user commitments.
- No AI, external integrations or new database tables are introduced.

### Verification state

P1-K through P1-M implementation batch prepared against the verified P1-J source snapshot. Local lint, build and functional verification are required before marking the batch complete.
