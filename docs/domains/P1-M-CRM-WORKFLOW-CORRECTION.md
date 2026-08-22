# P1-M CRM Workflow Correction — Reversible & Guided Workflow

## Scope

Completes the CRM workflow correction after the Lead/Opportunity lifecycle split.

## Reversible stages

Lead and Opportunity edit forms expose the complete valid stage sets. Domain services accept any valid stage-to-stage correction, while stage history records every change. The forward-only `Advance` control remains intentionally forward-only; manual Edit is the correction path.

## Guided opportunity creation

Opportunity creation now checks both Lead qualification and Lead stage. If the prerequisite is missing, the user is shown a guided screen with **Qualify lead & continue**. The server action sets the Lead to `QUALIFIED` and qualification `QUALIFIED`, then returns the user to the Opportunity creation flow.

## Lead/opportunity synchronization

The Action Center flags open opportunities whose commercial progress is materially ahead of the related Lead relationship stage. The recommendation links directly to Lead Edit and preserves a return path to the opportunity. The system recommends rather than silently mutating the Lead.

## Closing and reopening

Won/Lost remain Opportunity outcomes. Closed opportunities can be explicitly reopened to `OPEN` without changing their current stage, allowing the BD user to correct the record and move the stage backward if necessary.

## Database

No new migration is required for this checkpoint. The lifecycle correction migration already provides the required Opportunity stage history and lifecycle constraints.
