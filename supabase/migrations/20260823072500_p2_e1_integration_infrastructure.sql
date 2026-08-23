begin;

create table if not exists public.organization_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type text not null,
  provider text not null,
  status text not null default 'DISCONNECTED',
  display_name text not null,
  enabled boolean not null default false,
  config_json jsonb not null default '{}'::jsonb,
  last_used_at timestamptz,
  last_error text,
  connected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider),
  constraint organization_integrations_type_check
    check (type in ('EMAIL','CALENDAR','CALLING','WHATSAPP','ENRICHMENT','LOCATION')),
  constraint organization_integrations_status_check
    check (status in ('DISCONNECTED','CONNECTED','ERROR','DISABLED'))
);

create index if not exists organization_integrations_org_type_idx
  on public.organization_integrations(organization_id, type);

alter table public.organization_integrations enable row level security;

drop policy if exists organization_integrations_select on public.organization_integrations;
create policy organization_integrations_select
  on public.organization_integrations for select to authenticated
  using (public.is_org_member(organization_id));

drop policy if exists organization_integrations_insert on public.organization_integrations;
create policy organization_integrations_insert
  on public.organization_integrations for insert to authenticated
  with check (public.is_org_member(organization_id));

drop policy if exists organization_integrations_update on public.organization_integrations;
create policy organization_integrations_update
  on public.organization_integrations for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists organization_integrations_delete on public.organization_integrations;
create policy organization_integrations_delete
  on public.organization_integrations for delete to authenticated
  using (public.is_org_member(organization_id));

create or replace function public.set_organization_integrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists organization_integrations_updated_at on public.organization_integrations;
create trigger organization_integrations_updated_at
before update on public.organization_integrations
for each row execute function public.set_organization_integrations_updated_at();

commit;
