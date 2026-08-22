# P1-E.2 — Database / Domain Verification

## Purpose

Verify that the Phase 1 core schema is safe to build the Business + Contact domain on, without introducing UI or integration dependencies.

## Verification completed

- Core migration exists and is applied.
- All 16 Phase 1 CRM tables have RLS enabled.
- All 16 Phase 1 CRM tables have explicit policies.
- Tenant-scoped relationships are present across core business/CRM relationships.
- Append-only policies exist for activities, lead scores/factors, and lead stage history.
- System categories are seeded with `organization_id = NULL` and `is_system = true`.
- Category seed is idempotent via `ON CONFLICT DO NOTHING`.
- No organization-specific category data was inserted.
- No Phase 2 integrations or AI functionality were introduced.

## System categories

- Automotive
- Education & Coaching
- Fitness & Sports
- Healthcare & Wellness
- Home & Local Services
- Hospitality & Travel
- Other Local Business
- Professional Services
- Real Estate
- Restaurant & Cafe
- Retail Store
- Salon & Beauty

## Boundary

This unit does not create Business or Contact UI. P1-F owns those workflows.

## Migration

`20260822043000_p1_e2_seed_system_categories.sql`
