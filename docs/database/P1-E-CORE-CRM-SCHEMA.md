# P1-E — Core CRM Database Schema

Migration: `20260822041052_p1_e_core_crm_schema.sql`

## Scope

This migration establishes the Phase 1 CRM data layer defined by the Master Intelligence document:

- business categories
- businesses
- business sources
- website checks
- social profiles
- contacts
- leads
- opportunities
- activities
- tasks
- notes
- tags/entity tags
- lead scores/factors
- lead stage history

It also extends the existing organization/profile/member foundation with timezone, default currency, settings, profile contact fields, and member status.

## Security

All new tenant-owned tables have RLS enabled. Access is based on authenticated organization membership. Historical tables such as activities, score factors, scores, and lead stage history are append-only at the policy layer.

Composite foreign keys carrying `(id, organization_id)` are used for core relationships where practical to prevent cross-tenant references at the database level.

## State contracts

Lead stages: `NEW`, `QUALIFYING`, `QUALIFIED`, `CONTACTED`, `CONNECTED`, `INTERESTED`, `DEMO`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`, `NURTURE`.

Lead status: `ACTIVE`, `PAUSED`, `ON_HOLD`, `CLOSED`, `ARCHIVED`.

Opportunity status: `OPEN`, `WON`, `LOST`.

Task status: `OPEN`, `IN_PROGRESS`, `COMPLETED`, `DISMISSED`, `CANCELLED`.

Task priority: `LOW`, `NORMAL`, `HIGH`, `URGENT`.

Website classification/status: `WU`, `W0`, `W1`, `W2`, `W3`, `W4`.

## Applied state

The migration has already been applied to Supabase project `jtibxubffyvbqqjzpqfh` and verified for table creation and RLS policy presence.
