-- P1-E Core CRM Schema
-- Applied to Supabase project jtibxubffyvbqqjzpqfh on 2026-08-22.
-- This repository migration records the same schema change applied to the project.

alter table public.organizations
  add column if not exists timezone text not null default 'UTC',
  add column if not exists default_currency text not null default 'USD',
  add column if not exists settings_json jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text;

alter table public.organization_members
  add column if not exists status text not null default 'ACTIVE';

alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check check (role in ('owner','admin','manager','bd_user','viewer'));
alter table public.organization_members add constraint organization_members_status_check check (status in ('ACTIVE','INVITED','SUSPENDED','REMOVED'));

create table if not exists public.business_categories (
  id uuid primary key default gen_random_uuid(), organization_id uuid references public.organizations(id) on delete cascade,
  name text not null, slug text not null, is_system boolean not null default false, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id, organization_id)
);
create unique index if not exists business_categories_system_slug_uidx on public.business_categories(slug) where organization_id is null;
create unique index if not exists business_categories_tenant_slug_uidx on public.business_categories(organization_id, slug) where organization_id is not null;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, legal_name text, normalized_name text not null, address_line_1 text, address_line_2 text,
  city text, state text, postal_code text, country text, latitude double precision, longitude double precision,
  phone text, email text, website_url text, website_status text not null default 'WU', website_verified_at timestamptz,
  primary_category_id uuid, rating numeric(3,2), review_count integer, source_primary text, source_last_synced_at timestamptz,
  owner_user_id uuid references auth.users(id) on delete set null, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (id, organization_id), constraint businesses_name_check check (char_length(trim(name)) between 1 and 200),
  constraint businesses_website_status_check check (website_status in ('WU','W0','W1','W2','W3','W4')),
  constraint businesses_rating_check check (rating is null or (rating >= 0 and rating <= 5)),
  constraint businesses_review_count_check check (review_count is null or review_count >= 0)
);
alter table public.businesses add constraint businesses_category_fk foreign key (primary_category_id) references public.business_categories(id) on delete set null;
create index if not exists businesses_org_idx on public.businesses(organization_id);
create index if not exists businesses_org_owner_idx on public.businesses(organization_id, owner_user_id);
create index if not exists businesses_org_website_status_idx on public.businesses(organization_id, website_status);
create index if not exists businesses_org_normalized_name_idx on public.businesses(organization_id, normalized_name);
create index if not exists businesses_org_updated_idx on public.businesses(organization_id, updated_at desc);

create table if not exists public.business_sources (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null, provider text not null, provider_place_id text, provider_url text, raw_reference jsonb,
  first_seen_at timestamptz not null default now(), last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (id, organization_id),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete cascade
);
create unique index if not exists business_sources_provider_place_uidx on public.business_sources(organization_id, provider, provider_place_id) where provider_place_id is not null;
create index if not exists business_sources_business_idx on public.business_sources(organization_id, business_id);

create table if not exists public.business_website_checks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null, url_checked text not null, final_url text, http_status integer, reachable boolean not null default false,
  redirected boolean not null default false, classification text not null, check_method text not null,
  checked_at timestamptz not null default now(), error_code text, details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique (id, organization_id),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete cascade,
  constraint website_check_classification_check check (classification in ('WU','W0','W1','W2','W3','W4'))
);
create index if not exists business_website_checks_business_idx on public.business_website_checks(organization_id, business_id, checked_at desc);

create table if not exists public.business_social_profiles (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null, platform text not null, profile_url text not null, handle text, is_active boolean not null default true,
  last_verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, organization_id), unique (business_id, platform, profile_url),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete cascade
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null, first_name text, last_name text, full_name text not null, job_title text, phone text, email text,
  whatsapp_phone text, preferred_channel text, source text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  deleted_at timestamptz, unique (id, organization_id),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete cascade,
  constraint contacts_preferred_channel_check check (preferred_channel is null or preferred_channel in ('PHONE','EMAIL','WHATSAPP','OTHER'))
);
create index if not exists contacts_org_business_idx on public.contacts(organization_id, business_id);
create index if not exists contacts_org_email_idx on public.contacts(organization_id, email);
create index if not exists contacts_org_phone_idx on public.contacts(organization_id, phone);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid not null, primary_contact_id uuid, owner_user_id uuid references auth.users(id) on delete set null,
  stage text not null default 'NEW', status text not null default 'ACTIVE', source text, qualification_status text not null default 'UNQUALIFIED',
  opportunity_score numeric(6,2), priority_score numeric(6,2), last_contacted_at timestamptz, next_action_at timestamptz,
  converted_at timestamptz, lost_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique (id, organization_id), foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete restrict,
  foreign key (primary_contact_id, organization_id) references public.contacts(id, organization_id) on delete set null,
  constraint leads_stage_check check (stage in ('NEW','QUALIFYING','QUALIFIED','CONTACTED','CONNECTED','INTERESTED','DEMO','PROPOSAL','NEGOTIATION','WON','LOST','NURTURE')),
  constraint leads_status_check check (status in ('ACTIVE','PAUSED','ON_HOLD','CLOSED','ARCHIVED')),
  constraint leads_qualification_check check (qualification_status in ('UNQUALIFIED','QUALIFYING','QUALIFIED','DISQUALIFIED')),
  constraint leads_opportunity_score_check check (opportunity_score is null or (opportunity_score >= 0 and opportunity_score <= 100)),
  constraint leads_priority_score_check check (priority_score is null or (priority_score >= 0 and priority_score <= 100))
);
create unique index if not exists leads_business_active_uidx on public.leads(organization_id, business_id) where deleted_at is null;
create index if not exists leads_org_owner_idx on public.leads(organization_id, owner_user_id);
create index if not exists leads_org_stage_idx on public.leads(organization_id, stage);
create index if not exists leads_org_status_idx on public.leads(organization_id, status);
create index if not exists leads_org_next_action_idx on public.leads(organization_id, next_action_at);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null, name text not null, value_amount numeric(14,2), currency text not null default 'USD', probability numeric(5,2),
  expected_close_date date, stage text not null default 'QUALIFIED', status text not null default 'OPEN', owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), closed_at timestamptz,
  unique (id, organization_id), foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete restrict,
  constraint opportunities_value_check check (value_amount is null or value_amount >= 0),
  constraint opportunities_probability_check check (probability is null or (probability >= 0 and probability <= 100)),
  constraint opportunities_stage_check check (stage in ('QUALIFIED','CONTACTED','CONNECTED','INTERESTED','DEMO','PROPOSAL','NEGOTIATION')),
  constraint opportunities_status_check check (status in ('OPEN','WON','LOST'))
);
create index if not exists opportunities_org_owner_idx on public.opportunities(organization_id, owner_user_id);
create index if not exists opportunities_org_stage_idx on public.opportunities(organization_id, stage);
create index if not exists opportunities_org_status_idx on public.opportunities(organization_id, status);
create index if not exists opportunities_org_close_idx on public.opportunities(organization_id, expected_close_date);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid, lead_id uuid, contact_id uuid, opportunity_id uuid, user_id uuid references auth.users(id) on delete set null,
  type text not null, direction text, subject text, body_preview text, occurred_at timestamptz not null, provider text, provider_event_id text,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique (id, organization_id),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete set null,
  foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete set null,
  foreign key (contact_id, organization_id) references public.contacts(id, organization_id) on delete set null,
  foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete set null,
  constraint activities_type_check check (type in ('CALL','EMAIL','WHATSAPP','MEETING','NOTE','STATUS_CHANGE','STAGE_CHANGE','TASK_COMPLETED','DEMO_SENT','PROPOSAL_SENT','PROPOSAL_VIEWED','PAYMENT','SYSTEM')),
  constraint activities_direction_check check (direction is null or direction in ('INBOUND','OUTBOUND','INTERNAL','SYSTEM'))
);
create unique index if not exists activities_provider_event_uidx on public.activities(organization_id, provider, provider_event_id) where provider_event_id is not null;
create index if not exists activities_org_occurred_idx on public.activities(organization_id, occurred_at desc);
create index if not exists activities_org_lead_idx on public.activities(organization_id, lead_id, occurred_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid, lead_id uuid, opportunity_id uuid, assigned_to uuid references auth.users(id) on delete set null, created_by uuid references auth.users(id) on delete set null,
  type text not null, title text not null, description text, status text not null default 'OPEN', priority text not null default 'NORMAL',
  due_at timestamptz, completed_at timestamptz, source_rule_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, organization_id), foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete set null,
  foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete set null,
  foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete set null,
  constraint tasks_status_check check (status in ('OPEN','IN_PROGRESS','COMPLETED','DISMISSED','CANCELLED')),
  constraint tasks_priority_check check (priority in ('LOW','NORMAL','HIGH','URGENT'))
);
create index if not exists tasks_org_assignee_idx on public.tasks(organization_id, assigned_to);
create index if not exists tasks_org_status_idx on public.tasks(organization_id, status);
create index if not exists tasks_org_due_idx on public.tasks(organization_id, due_at);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  business_id uuid, lead_id uuid, opportunity_id uuid, author_user_id uuid references auth.users(id) on delete set null, body text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique (id, organization_id),
  foreign key (business_id, organization_id) references public.businesses(id, organization_id) on delete set null,
  foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete set null,
  foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete set null
);
create index if not exists notes_org_lead_idx on public.notes(organization_id, lead_id, created_at desc);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, slug text not null, color text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, organization_id), unique (organization_id, slug)
);

create table if not exists public.entity_tags (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  tag_id uuid not null, entity_type text not null, entity_id uuid not null, created_at timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id), foreign key (tag_id, organization_id) references public.tags(id, organization_id) on delete cascade,
  constraint entity_tags_entity_type_check check (entity_type in ('BUSINESS','CONTACT','LEAD','OPPORTUNITY','TASK'))
);
create index if not exists entity_tags_entity_idx on public.entity_tags(organization_id, entity_type, entity_id);

create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null, score numeric(6,2) not null, score_version text not null, calculated_at timestamptz not null default now(),
  calculation_context_json jsonb not null default '{}'::jsonb, unique (id, organization_id),
  foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete cascade,
  constraint lead_scores_score_check check (score >= 0 and score <= 100)
);
create index if not exists lead_scores_lead_idx on public.lead_scores(organization_id, lead_id, calculated_at desc);

create table if not exists public.lead_score_factors (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_score_id uuid not null, factor_code text not null, factor_label text not null, raw_value text, points numeric(6,2) not null,
  explanation text not null, created_at timestamptz not null default now(), unique (id, organization_id),
  foreign key (lead_score_id, organization_id) references public.lead_scores(id, organization_id) on delete cascade
);
create index if not exists lead_score_factors_score_idx on public.lead_score_factors(organization_id, lead_score_id);

create table if not exists public.lead_stage_history (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  lead_id uuid not null, from_stage text, to_stage text not null, changed_by uuid references auth.users(id) on delete set null,
  reason text, changed_at timestamptz not null default now(), unique (id, organization_id),
  foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete cascade,
  constraint lead_stage_history_from_check check (from_stage is null or from_stage in ('NEW','QUALIFYING','QUALIFIED','CONTACTED','CONNECTED','INTERESTED','DEMO','PROPOSAL','NEGOTIATION','WON','LOST','NURTURE')),
  constraint lead_stage_history_to_check check (to_stage in ('NEW','QUALIFYING','QUALIFIED','CONTACTED','CONNECTED','INTERESTED','DEMO','PROPOSAL','NEGOTIATION','WON','LOST','NURTURE'))
);
create index if not exists lead_stage_history_lead_idx on public.lead_stage_history(organization_id, lead_id, changed_at desc);

create or replace function public.validate_entity_tag_target() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.entity_type = 'BUSINESS' and not exists (select 1 from public.businesses where id = new.entity_id and organization_id = new.organization_id) then raise exception 'invalid business tag target';
  elsif new.entity_type = 'CONTACT' and not exists (select 1 from public.contacts where id = new.entity_id and organization_id = new.organization_id) then raise exception 'invalid contact tag target';
  elsif new.entity_type = 'LEAD' and not exists (select 1 from public.leads where id = new.entity_id and organization_id = new.organization_id) then raise exception 'invalid lead tag target';
  elsif new.entity_type = 'OPPORTUNITY' and not exists (select 1 from public.opportunities where id = new.entity_id and organization_id = new.organization_id) then raise exception 'invalid opportunity tag target';
  elsif new.entity_type = 'TASK' and not exists (select 1 from public.tasks where id = new.entity_id and organization_id = new.organization_id) then raise exception 'invalid task tag target';
  end if;
  return new;
end; $$;
drop trigger if exists entity_tags_validate_target on public.entity_tags;
create trigger entity_tags_validate_target before insert or update on public.entity_tags for each row execute function public.validate_entity_tag_target();

create or replace function public.set_profile_from_auth() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), new.email, new.phone, new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do update set email = excluded.email, phone = excluded.phone, updated_at = now();
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.set_profile_from_auth();

alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_sources enable row level security;
alter table public.business_website_checks enable row level security;
alter table public.business_social_profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.tags enable row level security;
alter table public.entity_tags enable row level security;
alter table public.lead_scores enable row level security;
alter table public.lead_score_factors enable row level security;
alter table public.lead_stage_history enable row level security;

create policy business_categories_select on public.business_categories for select to authenticated using ((organization_id is null and is_system) or public.is_org_member(organization_id));
create policy business_categories_insert on public.business_categories for insert to authenticated with check (organization_id is not null and public.has_org_role(organization_id, array['owner','admin','manager']));
create policy business_categories_update on public.business_categories for update to authenticated using (organization_id is not null and public.has_org_role(organization_id, array['owner','admin','manager'])) with check (organization_id is not null and public.has_org_role(organization_id, array['owner','admin','manager']));
create policy business_categories_delete on public.business_categories for delete to authenticated using (organization_id is not null and public.has_org_role(organization_id, array['owner','admin']));

create policy businesses_select on public.businesses for select to authenticated using (public.is_org_member(organization_id));
create policy businesses_insert on public.businesses for insert to authenticated with check (public.is_org_member(organization_id) and (owner_user_id is null or public.is_org_member(organization_id)));
create policy businesses_update on public.businesses for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy businesses_delete on public.businesses for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy business_sources_select on public.business_sources for select to authenticated using (public.is_org_member(organization_id));
create policy business_sources_insert on public.business_sources for insert to authenticated with check (public.is_org_member(organization_id));
create policy business_sources_update on public.business_sources for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy business_sources_delete on public.business_sources for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy website_checks_select on public.business_website_checks for select to authenticated using (public.is_org_member(organization_id));
create policy website_checks_insert on public.business_website_checks for insert to authenticated with check (public.is_org_member(organization_id));

create policy social_profiles_select on public.business_social_profiles for select to authenticated using (public.is_org_member(organization_id));
create policy social_profiles_insert on public.business_social_profiles for insert to authenticated with check (public.is_org_member(organization_id));
create policy social_profiles_update on public.business_social_profiles for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy social_profiles_delete on public.business_social_profiles for delete to authenticated using (public.is_org_member(organization_id));

create policy contacts_select on public.contacts for select to authenticated using (public.is_org_member(organization_id));
create policy contacts_insert on public.contacts for insert to authenticated with check (public.is_org_member(organization_id));
create policy contacts_update on public.contacts for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy contacts_delete on public.contacts for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy leads_select on public.leads for select to authenticated using (public.is_org_member(organization_id));
create policy leads_insert on public.leads for insert to authenticated with check (public.is_org_member(organization_id) and (owner_user_id is null or public.is_org_member(organization_id)));
create policy leads_update on public.leads for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy leads_delete on public.leads for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy opportunities_select on public.opportunities for select to authenticated using (public.is_org_member(organization_id));
create policy opportunities_insert on public.opportunities for insert to authenticated with check (public.is_org_member(organization_id));
create policy opportunities_update on public.opportunities for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy opportunities_delete on public.opportunities for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy activities_select on public.activities for select to authenticated using (public.is_org_member(organization_id));
create policy activities_insert on public.activities for insert to authenticated with check (public.is_org_member(organization_id));
create policy activities_no_update on public.activities for update to authenticated using (false) with check (false);
create policy activities_no_delete on public.activities for delete to authenticated using (false);

create policy tasks_select on public.tasks for select to authenticated using (public.is_org_member(organization_id));
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_org_member(organization_id));
create policy tasks_update on public.tasks for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy tasks_delete on public.tasks for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy notes_select on public.notes for select to authenticated using (public.is_org_member(organization_id));
create policy notes_insert on public.notes for insert to authenticated with check (public.is_org_member(organization_id));
create policy notes_update on public.notes for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy notes_delete on public.notes for delete to authenticated using (public.is_org_member(organization_id));

create policy tags_select on public.tags for select to authenticated using (public.is_org_member(organization_id));
create policy tags_insert on public.tags for insert to authenticated with check (public.is_org_member(organization_id));
create policy tags_update on public.tags for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy tags_delete on public.tags for delete to authenticated using (public.has_org_role(organization_id, array['owner','admin','manager']));

create policy entity_tags_select on public.entity_tags for select to authenticated using (public.is_org_member(organization_id));
create policy entity_tags_insert on public.entity_tags for insert to authenticated with check (public.is_org_member(organization_id));
create policy entity_tags_delete on public.entity_tags for delete to authenticated using (public.is_org_member(organization_id));

create policy lead_scores_select on public.lead_scores for select to authenticated using (public.is_org_member(organization_id));
create policy lead_scores_insert on public.lead_scores for insert to authenticated with check (public.is_org_member(organization_id));
create policy lead_scores_no_update on public.lead_scores for update to authenticated using (false) with check (false);
create policy lead_scores_no_delete on public.lead_scores for delete to authenticated using (false);

create policy lead_score_factors_select on public.lead_score_factors for select to authenticated using (public.is_org_member(organization_id));
create policy lead_score_factors_insert on public.lead_score_factors for insert to authenticated with check (public.is_org_member(organization_id));
create policy lead_score_factors_no_update on public.lead_score_factors for update to authenticated using (false) with check (false);
create policy lead_score_factors_no_delete on public.lead_score_factors for delete to authenticated using (false);

create policy lead_stage_history_select on public.lead_stage_history for select to authenticated using (public.is_org_member(organization_id));
create policy lead_stage_history_insert on public.lead_stage_history for insert to authenticated with check (public.is_org_member(organization_id));
create policy lead_stage_history_no_update on public.lead_stage_history for update to authenticated using (false) with check (false);
create policy lead_stage_history_no_delete on public.lead_stage_history for delete to authenticated using (false);

create trigger business_categories_set_updated_at before update on public.business_categories for each row execute function public.set_updated_at();
create trigger businesses_set_updated_at before update on public.businesses for each row execute function public.set_updated_at();
create trigger business_sources_set_updated_at before update on public.business_sources for each row execute function public.set_updated_at();
create trigger business_social_profiles_set_updated_at before update on public.business_social_profiles for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags for each row execute function public.set_updated_at();
