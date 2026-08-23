# P2-A.1 — Prospecting Session & Provider Reliability

## Apply

Extract this checkpoint over the current project root.

IMPORTANT: the previous Google Places checkpoint may have left this stale file in your working tree:

`lib/domains/prospecting/google-places.ts`

Delete it because Google Places is no longer an active provider:

```powershell
Remove-Item ".\lib\domains\prospecting\google-places.ts" -Force -ErrorAction SilentlyContinue
```

Then run:

```powershell
npm run lint
npm run build
```

No database migration is required.
