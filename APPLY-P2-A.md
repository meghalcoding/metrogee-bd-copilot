# P2-A India Prospecting — Apply

1. Extract this checkpoint over the project root.
2. Run the database migration in Supabase SQL Editor:
   `supabase/migrations/20260823010000_p2_india_defaults.sql`
3. Optional provider keys can be added to `.env.local`:
   - `GEOAPIFY_API_KEY`
   - `FOURSQUARE_API_KEY`
   - `MAPPLS_ACCESS_TOKEN`
4. `OpenStreetMap / Overpass` works without an API key.
5. Run:

```powershell
npm run lint
npm run build
```

6. Open `/prospecting`.
7. Test with an Indian PIN such as `390001`, `110001`, or another valid 6-digit PIN.
8. Select a category, radius, and one or more configured providers.
9. Verify that results are merged, can be ignored, and can be added to Businesses.
10. Verify that an added business retains provider metadata/source information and can then be used in the existing Business → Contact → Lead workflow.

## Google Maps classroom reference

Each result may expose an `Open in Google Maps` link. The application does not scrape or copy Google Maps data. Google Maps content remains outside the CRM and is only used as a manually opened reference.
