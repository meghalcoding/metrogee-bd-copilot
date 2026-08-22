# Metrogee BD Copilot — Master Intelligence

## Canonical status

This file is the repository-level continuity document for architecture, phase decisions, implementation history and verified checkpoints.

The repository currently contains phase-specific source documents under `docs/`. This Master Intelligence was introduced as a tracked file during P1-H because no repository-level Master Intelligence file existed in the supplied P1-H source checkpoint.

## Current phase

**P1-I — Action Center + Pipeline foundation**

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
