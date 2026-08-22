# P1-F — Business + Contact Domain

Date: 2026-08-22

## Scope

P1-F owns the application workflows for the existing `businesses` and `contacts` tables.

The database contract is already present from P1-E/P1-E.2. This unit does not add integration, AI, lead, opportunity, messaging, calendar, or automation behavior.

## Business domain

Implemented:

- Tenant-scoped business listing.
- Tenant-scoped business lookup.
- Business creation.
- Business update.
- Soft archive using `deleted_at`.
- Input normalization for names and optional fields.
- Website URL, email, rating, and review-count validation.
- Default website state `WU`.
- Explicit owner assignment at creation.
- UI for list, create, detail, and edit.

Business records remain factual, long-lived entities. Lead and opportunity state is deliberately not stored in the business workflow.

## Contact domain

Implemented:

- Contacts scoped to a business and organization.
- Contact listing.
- Contact lookup.
- Contact creation.
- Contact update.
- Soft archive using `deleted_at`.
- Name and email validation.
- Preferred-channel contract matching the database enum.

## Security boundary

All application mutations resolve the authenticated user and current organization before invoking the domain service. The database RLS policies remain the final tenant isolation boundary.

## Files

- `lib/domains/businesses/types.ts`
- `lib/domains/businesses/service.ts`
- `lib/domains/contacts/types.ts`
- `lib/domains/contacts/service.ts`
- `app/actions/businesses.ts`
- `app/actions/contacts.ts`
- `components/businesses/business-form.tsx`
- `components/contacts/contact-form.tsx`
- `components/contacts/contact-list.tsx`
- `app/businesses/page.tsx`
- `app/businesses/new/page.tsx`
- `app/businesses/[id]/page.tsx`
- `app/businesses/[id]/edit/page.tsx`

## Verification limitation

The uploaded repository does not contain a usable executable Next.js/ESLint installation in the working environment. The local `npm run lint` and `npm run build` commands therefore could not be executed successfully here; they returned `Permission denied` for the local `eslint` and `next` binaries.

The checkpoint must be verified on the user's Windows repository with:

```text
npm run lint
npm run build
```

Do not mark P1-F complete until both commands pass locally.
