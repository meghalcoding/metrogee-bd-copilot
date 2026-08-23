# P2-E.3 — Calendar & Meeting Workflow

## Apply

This checkpoint contains replacement/new files only. Extract it over the current project root.

```powershell
Expand-Archive ".\P2-E3-CALENDAR-MEETINGS.zip" -DestinationPath "." -Force
```

Apply this Supabase migration in SQL Editor:

```text
supabase/migrations/20260823090000_p2_e3_calendar_meetings.sql
```

Then:

```powershell
npm install
npm run lint
npm run build
```

## Test

1. Open `/meetings`.
2. Schedule a meeting.
3. Select a Business and confirm Lead/Opportunity/Contact options are filtered.
4. Confirm the meeting appears under Upcoming.
5. Open the meeting.
6. Download `.ics` and import/open it in a calendar application.
7. Test the Google Calendar handoff.
8. Test the Outlook handoff.
9. Mark the meeting Completed and confirm a MEETING activity appears on the related Lead/Business.
10. Repeat with No-show and Cancelled.
11. Open the related Lead and Business pages and confirm their Meetings sections show the scheduled meeting.

## Important

This phase does not implement Google/Microsoft OAuth or automatic two-way calendar synchronization. The CRM meeting is the source of truth, with universal `.ics` export and external calendar event-composer links.
