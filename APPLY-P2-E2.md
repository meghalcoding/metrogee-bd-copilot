# P2-E.2 Apply

1. Extract this checkpoint over the current project.
2. Run `npm install` to install Nodemailer and its TypeScript types.
3. Generate a server-only encryption key:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
4. Put that value in `.env.local` as `INTEGRATION_ENCRYPTION_KEY=...`.
5. Apply:
   `supabase/migrations/20260823120000_p2_e2_custom_smtp.sql`
6. Run:
   `npm run lint`
   `npm run build`
7. Open `/integrations`.
8. Configure a compatible SMTP service and use `Test connection`.
9. Save the SMTP configuration.
10. Open a Lead with a primary contact that has an email address.
11. Click Email, send a test message, and verify the EMAIL Activity and `last_contacted_at`.
12. Open a Business with an email-enabled contact and verify the Email action works there too.

Do not commit `.env.local` or the encryption key.
