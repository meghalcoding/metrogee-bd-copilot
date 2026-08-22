-- Fix the lead uniqueness rule so a business may have a new active lead
-- after a previous lead has been closed/archived.
--
-- The previous index only checked deleted_at IS NULL, which incorrectly
-- treated CLOSED leads as active for uniqueness purposes.

drop index if exists public.leads_business_active_uidx;

create unique index leads_business_active_uidx
on public.leads (organization_id, business_id)
where deleted_at is null
  and status in ('ACTIVE', 'PAUSED', 'ON_HOLD');
