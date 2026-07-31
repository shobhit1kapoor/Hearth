begin;

alter table public.care_commitments
  add column if not exists date_interpretation jsonb
    not null default '{"action":"no_numeric_date"}'::jsonb,
  add column if not exists clinical_shorthand jsonb
    not null default '{"action":"ordinary_review","terms":[]}'::jsonb,
  add column if not exists schedule_rule jsonb;

create table if not exists public.commitment_correction_conflicts (
  id uuid primary key default gen_random_uuid(),
  care_space_id uuid not null references public.care_spaces(id) on delete cascade,
  commitment_id uuid not null references public.care_commitments(id) on delete cascade,
  proposed_by uuid not null references auth.users(id) on delete restrict,
  base_version integer not null check (base_version > 0),
  observed_version integer not null check (observed_version > 0),
  existing_value jsonb not null,
  proposed_value jsonb not null,
  reason text not null,
  status text not null default 'unresolved'
    check (status in ('unresolved', 'resolved', 'dismissed')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolution jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commitment_correction_conflicts_commitment_idx
  on public.commitment_correction_conflicts(commitment_id, status, created_at desc);

create index if not exists commitment_correction_conflicts_care_space_idx
  on public.commitment_correction_conflicts(care_space_id, created_at desc);

drop trigger if exists commitment_correction_conflicts_set_updated_at
  on public.commitment_correction_conflicts;
create trigger commitment_correction_conflicts_set_updated_at
before update on public.commitment_correction_conflicts
for each row execute function public.set_updated_at();

alter table public.commitment_correction_conflicts enable row level security;

create or replace function public.can_edit_category(space_id uuid, category text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_care_space_admin(space_id) or exists (
    select 1
    from public.care_space_members member
    join public.permissions permission on permission.member_id = member.id
    where member.care_space_id = space_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and (member.expires_at is null or member.expires_at > now())
      and permission.can_view
      and permission.can_edit
      and permission.revoked_at is null
      and (permission.expires_at is null or permission.expires_at > now())
      and category = any(permission.allowed_categories)
  );
$$;

revoke all on function public.can_edit_category(uuid, text) from public;
grant execute on function public.can_edit_category(uuid, text) to authenticated;

drop policy if exists "commitments write members" on public.care_commitments;
drop policy if exists "commitments insert editors" on public.care_commitments;
create policy "commitments insert editors"
on public.care_commitments
for insert
with check (public.can_edit_category(care_space_id, 'tasks'));

drop policy if exists "commitments update editors" on public.care_commitments;
create policy "commitments update editors"
on public.care_commitments
for update
using (public.can_edit_category(care_space_id, 'tasks'))
with check (public.can_edit_category(care_space_id, 'tasks'));

drop policy if exists "commitments delete admins" on public.care_commitments;
create policy "commitments delete admins"
on public.care_commitments
for delete
using (public.is_care_space_admin(care_space_id));

drop policy if exists "storage read by care space membership" on storage.objects;
drop policy if exists "storage read by minimum disclosure" on storage.objects;
create policy "storage read by minimum disclosure"
on storage.objects
for select
to authenticated
using (
  case bucket_id
    when 'care-documents' then public.can_access_category((storage.foldername(name))[1]::uuid, 'documents')
    when 'caregiver-notes' then public.is_care_space_admin((storage.foldername(name))[1]::uuid)
    when 'generated-exports' then public.is_care_space_admin((storage.foldername(name))[1]::uuid)
    else false
  end
);

drop policy if exists "storage upload by care space membership" on storage.objects;
drop policy if exists "storage upload by document editors" on storage.objects;
create policy "storage upload by document editors"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'care-documents'
  and public.can_edit_category((storage.foldername(name))[1]::uuid, 'documents')
  or bucket_id in ('caregiver-notes', 'generated-exports')
  and public.is_care_space_admin((storage.foldername(name))[1]::uuid)
);

drop policy if exists "Members can read correction conflicts"
  on public.commitment_correction_conflicts;
create policy "Members can read correction conflicts"
on public.commitment_correction_conflicts
for select
using (public.can_access_category(care_space_id, 'tasks'));

drop policy if exists "Members can create correction conflicts"
  on public.commitment_correction_conflicts;
create policy "Members can create correction conflicts"
on public.commitment_correction_conflicts
for insert
with check (
  proposed_by = auth.uid()
  and public.can_access_category(care_space_id, 'tasks')
);

drop policy if exists "Admins can resolve correction conflicts"
  on public.commitment_correction_conflicts;
create policy "Admins can resolve correction conflicts"
on public.commitment_correction_conflicts
for update
using (public.is_care_space_admin(care_space_id))
with check (public.is_care_space_admin(care_space_id));

create or replace function public.list_my_care_space_invitations()
returns table (
  id uuid,
  care_space_id uuid,
  care_space_name text,
  role public.hearth_role,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    member.id,
    member.care_space_id,
    space.name,
    member.role,
    member.expires_at
  from public.care_space_members member
  join public.care_spaces space on space.id = member.care_space_id
  join auth.users account on account.id = auth.uid()
  where member.status = 'invited'
    and member.revoked_at is null
    and (member.expires_at is null or member.expires_at > now())
    and lower(member.invited_email) = lower(account.email);
$$;

create or replace function public.accept_care_space_invitation(invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  accepted_space_id uuid;
  account_email text;
  account_timezone text;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select account.email into account_email
  from auth.users account
  where account.id = auth.uid();

  update public.care_space_members member
  set
    user_id = auth.uid(),
    invited_email = null,
    status = 'active',
    accepted_at = now(),
    revoked_at = null
  where member.id = invitation_id
    and member.status = 'invited'
    and member.revoked_at is null
    and (member.expires_at is null or member.expires_at > now())
    and lower(member.invited_email) = lower(account_email)
  returning member.care_space_id into accepted_space_id;

  if accepted_space_id is null then
    raise exception 'invitation not found or no longer available';
  end if;

  insert into public.notification_preferences (
    care_space_id, user_id, master_enabled, in_app_enabled, daily_summary
  )
  values (accepted_space_id, auth.uid(), true, true, true)
  on conflict (care_space_id, user_id) do nothing;

  select profile.timezone into account_timezone
  from public.profiles profile
  where profile.id = auth.uid();

  insert into public.quiet_hours (care_space_id, user_id, timezone)
  values (accepted_space_id, auth.uid(), coalesce(account_timezone, 'UTC'))
  on conflict (care_space_id, user_id) do nothing;

  insert into public.audit_events (
    care_space_id, actor_id, event_type, object_type, object_id, outcome, safe_metadata
  )
  values (
    accepted_space_id,
    auth.uid(),
    'care_space_invitation_accepted',
    'care_space_member',
    invitation_id,
    'allowed',
    '{"minimum_disclosure":true}'::jsonb
  );

  return accepted_space_id;
end;
$$;

revoke all on function public.list_my_care_space_invitations() from public;
revoke all on function public.accept_care_space_invitation(uuid) from public;
grant execute on function public.list_my_care_space_invitations() to authenticated;
grant execute on function public.accept_care_space_invitation(uuid) to authenticated;

commit;
