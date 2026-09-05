# P2-F — Functional Command Center

## Purpose

Turn the root Command Center from a decorative dashboard into the BD user's operating cockpit.

## Rules

- All metrics are derived from live organization-scoped CRM data.
- No hard-coded counts, dates, names or fake activity are displayed.
- Command Center is an execution surface, not a replacement for Action Center.
- Recommendations remain deterministic and explainable through the existing rules engine.
- Committed Tasks remain distinct from recommendations.
- Open pipeline value is calculated from OPEN opportunities.
- Won-this-month is calculated from Opportunity `closed_at`.
- Upcoming meetings come from the first-class Meetings domain.
- Quick actions navigate to existing creation workflows.
- No AI is introduced.
- No new database tables or migrations are required.

## Data sources

- Leads
- Opportunities
- Tasks
- Meetings
- Deterministic recommended actions

## Verification

Run local lint/build and verify quick actions, live metrics, task completion, opportunity links, meeting links and empty states.
