begin;

create extension if not exists pgcrypto;

create type public.hearth_role as enum (
  'care_recipient',
  'primary_caregiver',
  'family_helper',
  'professional_reviewer',
  'researcher',
  'administrator'
);
create type public.member_status as enum ('invited', 'active', 'declined', 'revoked', 'expired');
create type public.commitment_state as enum (
  'identified',
  'needs_review',
  'assigned',
  'awaiting_acceptance',
  'accepted',
  'in_progress',
  'awaiting_external_response',
  'blocked',
  'escalated',
  'completed',
  'verified',
  'cancelled',
  'superseded'
);
create type public.risk_level as enum ('low', 'moderate', 'high', 'critical');
create type public.request_status as enum ('requested', 'processing', 'completed', 'failed', 'cancelled');

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en',
  timezone text not null default 'UTC',
  role public.hearth_role not null default 'primary_caregiver',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.care_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null check (char_length(name) between 1 and 120),
  mode text not null default 'caregiver' check (mode in ('caregiver', 'public_demo')),
  consent_acknowledged_at timestamptz,
  allow_identifiable_data boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.care_space_members (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  invited_email text,
  role public.hearth_role not null,
  status public.member_status not null default 'invited',
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (care_space_id, user_id, invited_email)
);

create table public.care_recipients (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  preferred_name text not null check (char_length(preferred_name) between 1 and 120),
  preferred_language text not null default 'en',
  preferences jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),
  storage_bucket text not null,
  storage_path text not null,
  original_file_name text not null,
  file_hash text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  document_type text,
  document_date date,
  version integer not null default 1,
  processing_status text not null default 'uploaded',
  synthetic boolean not null default false,
  supersedes_id uuid references public.source_documents(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (care_space_id, file_hash, version)
);

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  extracted_text text,
  image_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_document_id, page_number)
);

create table public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  provider text not null,
  model text not null,
  prompt_version text not null,
  status text not null default 'queued',
  input_hash text,
  output_json jsonb,
  token_usage jsonb not null default '{}'::jsonb,
  latency_ms integer,
  error_code text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.care_commitments (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  analysis_run_id uuid references public.analysis_runs(id),
  title text not null,
  plain_language_description text not null,
  category text not null,
  state public.commitment_state not null default 'identified',
  risk_level public.risk_level not null default 'moderate',
  owner_member_id uuid references public.care_space_members(id),
  due_at timestamptz,
  time_window text,
  confidence numeric(4,3) check (confidence between 0 and 1),
  evidence_kind text not null,
  possible_conflict text,
  requires_human_review boolean not null default true,
  escalation_target text,
  required_equipment jsonb not null default '[]'::jsonb,
  required_skill jsonb not null default '[]'::jsonb,
  dependencies jsonb not null default '[]'::jsonb,
  completion_evidence_rule text not null,
  completion_evidence jsonb,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  version integer not null default 1,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commitment_sources (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  commitment_id uuid not null references public.care_commitments(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id),
  document_page_id uuid references public.document_pages(id),
  source_excerpt text not null,
  source_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commitment_events (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  commitment_id uuid not null references public.care_commitments(id) on delete cascade,
  actor_id uuid references auth.users(id),
  from_state public.commitment_state,
  to_state public.commitment_state not null,
  reason text,
  evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  member_id uuid not null references public.care_space_members(id) on delete cascade,
  purpose text not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  can_receive_alerts boolean not null default false,
  can_access_documents boolean not null default false,
  can_contact_professionals boolean not null default false,
  allowed_categories text[] not null default '{}',
  withheld_categories text[] not null default '{}',
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.permission_events (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  master_enabled boolean not null default true,
  email_enabled boolean not null default false,
  in_app_enabled boolean not null default true,
  daily_summary boolean not null default true,
  category_settings jsonb not null default '{
    "daily_responsibilities": true,
    "appointments": true,
    "medication_refills": true,
    "family_task_updates": true,
    "external_responses": true,
    "routine_summaries": true,
    "professional_review": true
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (care_space_id, user_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  safety_critical boolean not null default false,
  delayed_by_quiet_hours boolean not null default false,
  deliver_after timestamptz,
  read_at timestamptz,
  email_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiet_hours (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  start_time time not null default '21:00',
  end_time time not null default '07:00',
  days smallint[] not null default '{0,1,2,3,4,5,6}',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (care_space_id, user_id)
);

create table public.translations (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  commitment_id uuid references public.care_commitments(id) on delete cascade,
  source_document_id uuid references public.source_documents(id) on delete cascade,
  original_text text not null,
  translated_text text not null,
  source_language text not null,
  target_language text not null,
  provider text not null,
  model text not null,
  confidence numeric(4,3) check (confidence between 0 and 1),
  verification_state text not null default 'machine_translated',
  verified_by uuid references auth.users(id),
  human_correction text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  input_json jsonb not null,
  required_hours numeric(6,2) not null,
  available_hours numeric(6,2) not null,
  deficit_hours numeric(6,2) not null,
  recommendation_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.escalations (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  commitment_id uuid references public.care_commitments(id),
  severity public.risk_level not null,
  reason text not null,
  target text not null,
  status text not null default 'open',
  resolved_by uuid references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accountability_receipts (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,
  reason text not null,
  source_json jsonb not null default '[]'::jsonb,
  confidence numeric(4,3),
  information_used jsonb not null default '[]'::jsonb,
  information_shared jsonb not null default '[]'::jsonb,
  information_withheld jsonb not null default '[]'::jsonb,
  permission_id uuid references public.permissions(id),
  human_approval jsonb,
  external_recipient text,
  outcome text,
  remaining_uncertainty text,
  next_step text,
  correction_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid references public.care_spaces(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  object_type text,
  object_id uuid,
  outcome text not null,
  safe_metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  previous_hash text,
  event_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.export_requests (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  status public.request_status not null default 'requested',
  format text not null check (format in ('json', 'pdf')),
  storage_path text,
  completed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  status public.request_status not null default 'requested',
  identity_confirmed_at timestamptz,
  affected_records jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  preserved_audit_summary jsonb,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.demo_sessions (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid references public.care_spaces(id) on delete cascade,
  anonymous_session_hash text not null unique,
  resolution_json jsonb not null default '{}'::jsonb,
  reset_count integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.validation_runs (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid references public.care_spaces(id) on delete cascade,
  suite_name text not null,
  configuration text not null,
  code_commit text,
  status text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.validation_results (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid references public.care_spaces(id) on delete cascade,
  validation_run_id uuid not null references public.validation_runs(id) on delete cascade,
  case_id text not null,
  passed boolean not null,
  safe_result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (validation_run_id, case_id)
);

create index care_space_members_user_idx on public.care_space_members(user_id, status);
create index care_recipients_space_idx on public.care_recipients(care_space_id);
create index source_documents_space_status_idx on public.source_documents(care_space_id, processing_status) where deleted_at is null;
create index document_pages_document_idx on public.document_pages(source_document_id, page_number);
create index analysis_runs_document_idx on public.analysis_runs(source_document_id, created_at desc);
create index commitments_space_state_due_idx on public.care_commitments(care_space_id, state, due_at) where deleted_at is null;
create index commitment_events_commitment_idx on public.commitment_events(commitment_id, created_at);
create index permissions_member_idx on public.permissions(member_id) where revoked_at is null;
create index notifications_user_delivery_idx on public.notifications(user_id, deliver_after) where read_at is null;
create index audit_events_space_created_idx on public.audit_events(care_space_id, created_at desc);
create index receipts_space_created_idx on public.accountability_receipts(care_space_id, created_at desc);

create or replace function public.is_active_care_space_member(space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_space_members m
    where m.care_space_id = space_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

create or replace function public.is_care_space_admin(space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_space_members m
    where m.care_space_id = space_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('primary_caregiver', 'care_recipient', 'administrator')
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

create or replace function public.can_access_category(space_id uuid, category text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_care_space_admin(space_id) or exists (
    select 1
    from public.care_space_members m
    join public.permissions p on p.member_id = m.id
    where m.care_space_id = space_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (m.expires_at is null or m.expires_at > now())
      and p.can_view
      and p.revoked_at is null
      and (p.expires_at is null or p.expires_at > now())
      and category = any(p.allowed_categories)
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'preferred_language', 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.create_care_space_with_defaults(
  space_name text,
  recipient_name text,
  relationship text,
  preferred_language text,
  notifications_enabled boolean,
  consent_acknowledged boolean
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  new_space_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not consent_acknowledged then raise exception 'consent acknowledgment required'; end if;

  insert into public.care_spaces (owner_id, name, consent_acknowledged_at, allow_identifiable_data)
  values (auth.uid(), left(trim(space_name), 120), now(), false)
  returning id into new_space_id;

  insert into public.care_space_members (care_space_id, user_id, role, status, accepted_at)
  values (new_space_id, auth.uid(), 'primary_caregiver', 'active', now());

  insert into public.care_recipients (care_space_id, preferred_name, preferred_language, preferences)
  values (
    new_space_id,
    left(trim(recipient_name), 120),
    preferred_language,
    jsonb_build_object('caregiver_relationship', left(trim(relationship), 80))
  );

  insert into public.notification_preferences (
    care_space_id, user_id, master_enabled, in_app_enabled, daily_summary
  ) values (
    new_space_id, auth.uid(), notifications_enabled, notifications_enabled, notifications_enabled
  );

  insert into public.quiet_hours (care_space_id, user_id, timezone)
  select new_space_id, auth.uid(), coalesce(timezone, 'UTC')
  from public.profiles where id = auth.uid();

  insert into public.audit_events (care_space_id, actor_id, event_type, outcome, safe_metadata)
  values (new_space_id, auth.uid(), 'care_space_created', 'allowed', jsonb_build_object('mode', 'caregiver'));

  return new_space_id;
end;
$$;

grant execute on function public.create_care_space_with_defaults(text,text,text,text,boolean,boolean) to authenticated;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','care_spaces','care_space_members','care_recipients','source_documents','document_pages',
    'analysis_runs','care_commitments','commitment_sources','commitment_events','permissions','permission_events',
    'notification_preferences','notifications','quiet_hours','translations','capacity_snapshots','escalations',
    'accountability_receipts','audit_events','export_requests','deletion_requests','demo_sessions','validation_runs',
    'validation_results'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy "profiles read own" on public.profiles for select using (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "care spaces read members" on public.care_spaces for select using (public.is_active_care_space_member(id));
create policy "care spaces create owner" on public.care_spaces for insert with check (owner_id = auth.uid());
create policy "care spaces update admins" on public.care_spaces for update using (public.is_care_space_admin(id));

create policy "members read same care space" on public.care_space_members for select using (public.is_active_care_space_member(care_space_id));
create policy "members create by owner" on public.care_space_members for insert with check (
  exists (select 1 from public.care_spaces s where s.id = care_space_id and s.owner_id = auth.uid())
);
create policy "members update admins" on public.care_space_members for update using (public.is_care_space_admin(care_space_id));

create policy "recipients read authorized" on public.care_recipients for select using (public.can_access_category(care_space_id, 'care_recipient'));
create policy "recipients write admins" on public.care_recipients for all using (public.is_care_space_admin(care_space_id)) with check (public.is_care_space_admin(care_space_id));

create policy "documents read authorized" on public.source_documents for select using (public.can_access_category(care_space_id, 'documents'));
create policy "documents insert members" on public.source_documents for insert with check (public.is_active_care_space_member(care_space_id) and uploaded_by = auth.uid());
create policy "documents update uploader or admin" on public.source_documents for update using (uploaded_by = auth.uid() or public.is_care_space_admin(care_space_id));
create policy "pages read authorized" on public.document_pages for select using (public.can_access_category(care_space_id, 'documents'));
create policy "pages write members" on public.document_pages for insert with check (public.is_active_care_space_member(care_space_id));

create policy "analysis read members" on public.analysis_runs for select using (public.is_active_care_space_member(care_space_id));
create policy "analysis insert requester" on public.analysis_runs for insert with check (public.is_active_care_space_member(care_space_id) and requested_by = auth.uid());
create policy "analysis update requester" on public.analysis_runs for update using (requested_by = auth.uid());

create policy "commitments read authorized" on public.care_commitments for select using (public.can_access_category(care_space_id, 'tasks'));
create policy "commitments write members" on public.care_commitments for all using (public.is_active_care_space_member(care_space_id)) with check (public.is_active_care_space_member(care_space_id));
create policy "commitment sources read authorized" on public.commitment_sources for select using (public.can_access_category(care_space_id, 'tasks'));
create policy "commitment sources insert members" on public.commitment_sources for insert with check (public.is_active_care_space_member(care_space_id));
create policy "commitment events read authorized" on public.commitment_events for select using (public.can_access_category(care_space_id, 'tasks'));
create policy "commitment events append members" on public.commitment_events for insert with check (public.is_active_care_space_member(care_space_id));

create policy "permissions read same space" on public.permissions for select using (public.is_active_care_space_member(care_space_id));
create policy "permissions write admins" on public.permissions for all using (public.is_care_space_admin(care_space_id)) with check (public.is_care_space_admin(care_space_id));
create policy "permission events read same space" on public.permission_events for select using (public.is_active_care_space_member(care_space_id));
create policy "permission events append admins" on public.permission_events for insert with check (public.is_care_space_admin(care_space_id));

create policy "notification preferences own" on public.notification_preferences for all using (user_id = auth.uid() and public.is_active_care_space_member(care_space_id)) with check (user_id = auth.uid() and public.is_active_care_space_member(care_space_id));
create policy "notifications own" on public.notifications for select using (user_id = auth.uid() and public.is_active_care_space_member(care_space_id));
create policy "notifications update own" on public.notifications for update using (user_id = auth.uid());
create policy "quiet hours own" on public.quiet_hours for all using (user_id = auth.uid() and public.is_active_care_space_member(care_space_id)) with check (user_id = auth.uid() and public.is_active_care_space_member(care_space_id));

create policy "translations read authorized" on public.translations for select using (public.can_access_category(care_space_id, 'tasks'));
create policy "translations write members" on public.translations for all using (public.is_active_care_space_member(care_space_id)) with check (public.is_active_care_space_member(care_space_id));
create policy "capacity own or admin" on public.capacity_snapshots for all using (user_id = auth.uid() or public.is_care_space_admin(care_space_id)) with check (user_id = auth.uid() or public.is_care_space_admin(care_space_id));
create policy "escalations read members" on public.escalations for select using (public.is_active_care_space_member(care_space_id));
create policy "escalations write members" on public.escalations for all using (public.is_active_care_space_member(care_space_id)) with check (public.is_active_care_space_member(care_space_id));
create policy "receipts read members" on public.accountability_receipts for select using (public.is_active_care_space_member(care_space_id));
create policy "receipts append members" on public.accountability_receipts for insert with check (public.is_active_care_space_member(care_space_id));
create policy "audit read admins" on public.audit_events for select using (care_space_id is null and actor_id = auth.uid() or public.is_care_space_admin(care_space_id));
create policy "audit append member" on public.audit_events for insert with check (care_space_id is null or public.is_active_care_space_member(care_space_id));
create policy "exports own or admin" on public.export_requests for all using (requested_by = auth.uid() or public.is_care_space_admin(care_space_id)) with check (requested_by = auth.uid() or public.is_care_space_admin(care_space_id));
create policy "deletions owner only" on public.deletion_requests for all using (requested_by = auth.uid() and public.is_care_space_admin(care_space_id)) with check (requested_by = auth.uid() and public.is_care_space_admin(care_space_id));

create policy "validation authenticated read" on public.validation_runs for select using (auth.uid() is not null);
create policy "validation results authenticated read" on public.validation_results for select using (auth.uid() is not null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('care-documents', 'care-documents', false, 10485760, array['application/pdf','image/jpeg','image/png','text/plain']),
  ('caregiver-notes', 'caregiver-notes', false, 1048576, array['text/plain']),
  ('generated-exports', 'generated-exports', false, 52428800, array['application/json','application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "storage read by care space membership"
on storage.objects for select to authenticated
using (
  bucket_id in ('care-documents','caregiver-notes','generated-exports')
  and public.is_active_care_space_member((storage.foldername(name))[1]::uuid)
);
create policy "storage upload by care space membership"
on storage.objects for insert to authenticated
with check (
  bucket_id in ('care-documents','caregiver-notes','generated-exports')
  and public.is_active_care_space_member((storage.foldername(name))[1]::uuid)
);
create policy "storage update by care space admins"
on storage.objects for update to authenticated
using (public.is_care_space_admin((storage.foldername(name))[1]::uuid));
create policy "storage delete by care space admins"
on storage.objects for delete to authenticated
using (public.is_care_space_admin((storage.foldername(name))[1]::uuid));

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','care_spaces','care_space_members','care_recipients','source_documents','document_pages',
    'analysis_runs','care_commitments','commitment_sources','commitment_events','permissions','permission_events',
    'notification_preferences','notifications','quiet_hours','translations','capacity_snapshots','escalations',
    'accountability_receipts','audit_events','export_requests','deletion_requests','demo_sessions','validation_runs',
    'validation_results'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

commit;
