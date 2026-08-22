# Lead uniqueness hotfix

Your application build and the C-G workflow tests are passing. The remaining failure in the dev log is a database-index issue.

The current `leads_business_active_uidx` index treats every non-deleted lead as active, including `CLOSED` leads. That is why updating/qualifying a lead can hit `duplicate key value violates unique constraint "leads_business_active_uidx"`.

Run this migration in Supabase SQL Editor:

`supabase/migrations/20260823002500_fix_leads_active_unique_index.sql`

Then restart the dev server if necessary and retest:

1. Closed lead → create a new lead for the same business.
2. Existing active lead → do not create a second active lead.
3. Existing active lead → qualify it for an opportunity.
4. Create opportunity → return-to flow.

No application source files need to be replaced for this hotfix.
