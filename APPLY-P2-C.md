# P2-C — Multi-Provider Enrichment

Extract the checkpoint over the current project root.

Run:

```powershell
npm run lint
npm run build
```

No Supabase migration is required.

Test:

1. Open an existing Business created by Prospecting.
2. Click **Enrich from providers**.
3. Confirm provider results are matched conservatively.
4. Confirm missing phone/website/email/address/rating/review data can be filled.
5. Confirm existing non-null CRM values are not overwritten.
6. Confirm provider provenance remains available in Business metadata/sources.
7. Confirm a provider failure does not prevent other configured providers from enriching the Business.
