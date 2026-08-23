# P2-B — Prospect → CRM Handoff

Extract this checkpoint over the current project root.

No database migration is required.

Run:

```powershell
npm run lint
npm run build
```

Then test Prospecting:

1. Search an Indian PIN/category.
2. Add a prospect.
3. Confirm the result changes to CRM actions.
4. Click **Open business** and confirm the exact business opens.
5. Return to Prospecting and confirm the search session remains.
6. Add another prospect and click **Add contact**. The business page should open with the contact form already displayed.
7. Save the contact and confirm it appears under Contacts.
8. From the prospect result click **Create lead** and confirm the lead form is pre-associated with that business.

This phase intentionally does not create a Lead automatically when a prospect is added. A Business is the durable CRM record; the BD explicitly starts the Contact/Lead relationship when they are ready.
