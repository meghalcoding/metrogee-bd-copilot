begin;

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid,
  lead_id uuid,
  contact_id uuid,
  opportunity_id uuid,
  title text not null,
  description text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'Asia/Kolkata',
  status text not null default 'SCHEDULED',
  provider text not null default 'CRM_ICS',
  external_event_id text,
  external_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete set null,
  foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete set null,
  foreign key (contact_id, organization_id) references public.contacts(id, organization_id) on delete set null,
  foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete set null,
  constraint meetings_title_check check (char_length(trim(title)) between 1 and 240),
  constraint meetings_time_check check (end_at > start_at),
  constraint meetings_status_check check (status in ('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW'))
);

create index if not exists meetings_org_start_idx on public.meetings(organization_id, start_at);
create index if not exists meetings_org_status_idx on public.meetings(organization_id, status);
create index if not exists meetings_org_lead_idx on public.meetings(organization_id, lead_id, start_at);
create index if not exists meetings_org_business_idx on public.meetings(organization_id, business_id, start_at);
create index if not exists meetings_org_opportunity_idx on public.meetings(organization_id, opportunity_id, start_at);

alter table public.meetings enable row level security;

drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings for select to authenticated using (public.is_org_member(organization_id));

drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings for insert to authenticated with check (public.is_org_member(organization_id));

drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete to authenticated using (public.is_org_member(organization_id));

create or replace function public.set_meetings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meetings_updated_at on public.meetings;
create trigger meetings_updated_at
before update on public.meetings
for each row execute function public.set_meetings_updated_at();

commit;
