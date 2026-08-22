begin;

-- Preserve existing data while moving deal-only lifecycle states out of leads.
update public.leads
set stage = 'INTERESTED'
where stage in ('DEMO', 'PROPOSAL', 'NEGOTIATION');

update public.leads
set stage = 'INTERESTED', status = 'CLOSED'
where stage in ('WON', 'LOST');

update public.lead_stage_history
set from_stage = case when from_stage in ('DEMO','PROPOSAL','NEGOTIATION','WON','LOST') then 'INTERESTED' else from_stage end,
    to_stage = case when to_stage in ('DEMO','PROPOSAL','NEGOTIATION','WON','LOST') then 'INTERESTED' else to_stage end
where from_stage in ('DEMO','PROPOSAL','NEGOTIATION','WON','LOST')
   or to_stage in ('DEMO','PROPOSAL','NEGOTIATION','WON','LOST');

-- Existing opportunity stages are retained conceptually but normalized to the new deal lifecycle.
update public.opportunities set stage = 'DISCOVERY'
where stage in ('QUALIFIED', 'CONTACTED', 'CONNECTED', 'INTERESTED');

update public.opportunities set stage = 'SOLUTIONING'
where stage = 'DEMO';

alter table public.opportunities add column if not exists lost_reason text;

update public.opportunities
set closed_at = coalesce(closed_at, now())
where status in ('WON', 'LOST');

-- Replace legacy lifecycle constraints.
alter table public.leads drop constraint if exists leads_stage_check;
alter table public.leads add constraint leads_stage_check
  check (stage in ('NEW','QUALIFYING','QUALIFIED','CONTACTED','CONNECTED','INTERESTED','NURTURE'));

alter table public.lead_stage_history drop constraint if exists lead_stage_history_from_check;
alter table public.lead_stage_history drop constraint if exists lead_stage_history_to_check;
alter table public.lead_stage_history add constraint lead_stage_history_from_check
  check (from_stage is null or from_stage in ('NEW','QUALIFYING','QUALIFIED','CONTACTED','CONNECTED','INTERESTED','NURTURE'));
alter table public.lead_stage_history add constraint lead_stage_history_to_check
  check (to_stage in ('NEW','QUALIFYING','QUALIFIED','CONTACTED','CONNECTED','INTERESTED','NURTURE'));

alter table public.opportunities drop constraint if exists opportunities_stage_check;
alter table public.opportunities add constraint opportunities_stage_check
  check (stage in ('DISCOVERY','SOLUTIONING','PROPOSAL','NEGOTIATION','CONTRACTING','DELIVERY'));

alter table public.opportunities drop constraint if exists opportunities_status_check;
alter table public.opportunities add constraint opportunities_status_check
  check (status in ('OPEN','ON_HOLD','WON','LOST'));

create table if not exists public.opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid not null,
  from_stage text,
  to_stage text not null,
  reason text,
  changed_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete cascade,
  constraint opportunity_stage_history_from_check check (from_stage is null or from_stage in ('DISCOVERY','SOLUTIONING','PROPOSAL','NEGOTIATION','CONTRACTING','DELIVERY')),
  constraint opportunity_stage_history_to_check check (to_stage in ('DISCOVERY','SOLUTIONING','PROPOSAL','NEGOTIATION','CONTRACTING','DELIVERY'))
);

create index if not exists opportunity_stage_history_opportunity_idx
  on public.opportunity_stage_history(organization_id, opportunity_id, changed_at desc);

alter table public.opportunity_stage_history enable row level security;

create policy opportunity_stage_history_select
  on public.opportunity_stage_history for select to authenticated
  using (public.is_org_member(organization_id));

create policy opportunity_stage_history_insert
  on public.opportunity_stage_history for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy opportunity_stage_history_no_update
  on public.opportunity_stage_history for update to authenticated
  using (false) with check (false);

create policy opportunity_stage_history_no_delete
  on public.opportunity_stage_history for delete to authenticated
  using (false);

-- Backfill stage history for opportunities that existed before this migration.
insert into public.opportunity_stage_history (organization_id, opportunity_id, from_stage, to_stage, reason)
select organization_id, id, null, stage, 'Lifecycle migration backfill'
from public.opportunities o
where not exists (
  select 1
  from public.opportunity_stage_history h
  where h.organization_id = o.organization_id
    and h.opportunity_id = o.id
);

commit;
