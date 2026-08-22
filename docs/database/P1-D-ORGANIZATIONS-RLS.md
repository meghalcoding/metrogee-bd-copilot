# P1-D — Organizations, Memberships and RLS

## Implemented

- `profiles`
- `organizations`
- `organization_members`
- automatic profile creation for new Auth users
- organization creation RPC
- organization membership helpers
- role model: owner, admin, manager, bd_user, viewer
- RLS enabled on all three tenant-foundation tables
- member/admin/owner policies
- timestamp trigger foundation

## Important boundary

All future tenant-owned CRM tables must carry `organization_id` and use RLS. Provider IDs and internal IDs remain separate.

## Migration

`20260822090000_p1_d_organizations_memberships_rls.sql`

## Applied

Applied directly to Supabase project `jtibxubffyvbqqjzpqfh` and verified with SQL inspection.

## Local verification

After copying this migration into the repository:

- `npm run lint`
- `npm run build`
- verify the migration is tracked by Git
