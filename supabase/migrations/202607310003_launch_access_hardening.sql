begin;

alter table public.care_space_members
  add column if not exists display_name text
    check (display_name is null or char_length(display_name) between 1 and 120);

create or replace function public.is_active_care_space_member(space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_space_members member
    where member.care_space_id = space_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.revoked_at is null
      and (member.expires_at is null or member.expires_at > now())
  );
$$;

create or replace function public.is_care_space_admin(space_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.care_space_members member
    where member.care_space_id = space_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.revoked_at is null
      and member.role in ('primary_caregiver', 'care_recipient', 'administrator')
      and (member.expires_at is null or member.expires_at > now())
  );
$$;

create or replace function public.can_access_assigned_commitment(
  space_id uuid,
  assigned_member_id uuid
)
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
    where member.id = assigned_member_id
      and member.care_space_id = space_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.revoked_at is null
      and (member.expires_at is null or member.expires_at > now())
      and permission.can_view
      and permission.revoked_at is null
      and (permission.expires_at is null or permission.expires_at > now())
      and 'tasks' = any(permission.allowed_categories)
  );
$$;

create or replace function public.can_edit_assigned_commitment(
  space_id uuid,
  assigned_member_id uuid
)
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
    where member.id = assigned_member_id
      and member.care_space_id = space_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.revoked_at is null
      and (member.expires_at is null or member.expires_at > now())
      and permission.can_view
      and permission.can_edit
      and permission.revoked_at is null
      and (permission.expires_at is null or permission.expires_at > now())
      and 'tasks' = any(permission.allowed_categories)
  );
$$;

create or replace function public.can_access_commitment_by_id(commitment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_assigned_commitment(commitment.care_space_id, commitment.owner_member_id)
  from public.care_commitments commitment
  where commitment.id = commitment_id;
$$;

create or replace function public.can_edit_commitment_by_id(commitment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_edit_assigned_commitment(commitment.care_space_id, commitment.owner_member_id)
  from public.care_commitments commitment
  where commitment.id = commitment_id;
$$;

create or replace function public.guard_commitment_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_member_id is not null and not exists (
    select 1 from public.care_space_members member
    where member.id = new.owner_member_id
      and member.care_space_id = new.care_space_id
      and member.status in ('invited', 'active')
      and member.revoked_at is null
      and (member.expires_at is null or member.expires_at > now())
  ) then
    raise exception 'assigned helper must belong to this care space';
  end if;

  if public.is_care_space_admin(old.care_space_id) then
    return new;
  end if;

  if old.owner_member_id is null
    or old.owner_member_id <> new.owner_member_id
    or not public.can_edit_assigned_commitment(old.care_space_id, old.owner_member_id)
  then
    raise exception 'only the assigned helper may update this task';
  end if;

  if (to_jsonb(new) - array['state', 'completion_evidence', 'version', 'updated_at'])
    is distinct from
    (to_jsonb(old) - array['state', 'completion_evidence', 'version', 'updated_at'])
  then
    raise exception 'helpers may only update task progress and completion evidence';
  end if;

  if not (
    (old.state = 'awaiting_acceptance' and new.state = 'accepted' and new.completion_evidence is not distinct from old.completion_evidence)
    or (old.state = 'accepted' and new.state = 'in_progress' and new.completion_evidence is not distinct from old.completion_evidence)
    or (old.state = 'in_progress' and new.state = 'completed' and new.completion_evidence is not null)
  ) then
    raise exception 'invalid helper task transition';
  end if;

  if new.version <> old.version + 1 then
    raise exception 'task version must increase by one';
  end if;
  return new;
end;
$$;

drop trigger if exists care_commitments_guard_update on public.care_commitments;
create trigger care_commitments_guard_update
before update on public.care_commitments
for each row execute function public.guard_commitment_update();

revoke all on function public.can_access_assigned_commitment(uuid, uuid) from public;
revoke all on function public.can_edit_assigned_commitment(uuid, uuid) from public;
revoke all on function public.can_access_commitment_by_id(uuid) from public;
revoke all on function public.can_edit_commitment_by_id(uuid) from public;
grant execute on function public.can_access_assigned_commitment(uuid, uuid) to authenticated;
grant execute on function public.can_edit_assigned_commitment(uuid, uuid) to authenticated;
grant execute on function public.can_access_commitment_by_id(uuid) to authenticated;
grant execute on function public.can_edit_commitment_by_id(uuid) to authenticated;

drop policy if exists "members read same care space" on public.care_space_members;
drop policy if exists "members read self or admins" on public.care_space_members;
create policy "members read self or admins"
on public.care_space_members for select
using (user_id = auth.uid() or public.is_care_space_admin(care_space_id));

drop policy if exists "permissions read same space" on public.permissions;
drop policy if exists "permissions read own or admins" on public.permissions;
create policy "permissions read own or admins"
on public.permissions for select
using (
  public.is_care_space_admin(care_space_id)
  or exists (
    select 1 from public.care_space_members member
    where member.id = permissions.member_id and member.user_id = auth.uid()
  )
);

drop policy if exists "permission events read same space" on public.permission_events;
drop policy if exists "permission events read admins" on public.permission_events;
create policy "permission events read admins"
on public.permission_events for select
using (public.is_care_space_admin(care_space_id));

drop policy if exists "analysis read members" on public.analysis_runs;
drop policy if exists "analysis read admins" on public.analysis_runs;
create policy "analysis read admins"
on public.analysis_runs for select
using (public.is_care_space_admin(care_space_id));

drop policy if exists "commitments read authorized" on public.care_commitments;
drop policy if exists "commitments read assigned" on public.care_commitments;
create policy "commitments read assigned"
on public.care_commitments for select
using (public.can_access_assigned_commitment(care_space_id, owner_member_id));

drop policy if exists "commitments insert editors" on public.care_commitments;
drop policy if exists "commitments insert admins" on public.care_commitments;
create policy "commitments insert admins"
on public.care_commitments for insert
with check (public.is_care_space_admin(care_space_id));

drop policy if exists "commitments update editors" on public.care_commitments;
drop policy if exists "commitments update assigned" on public.care_commitments;
create policy "commitments update assigned"
on public.care_commitments for update
using (public.can_edit_assigned_commitment(care_space_id, owner_member_id))
with check (public.can_edit_assigned_commitment(care_space_id, owner_member_id));

drop policy if exists "commitment sources read authorized" on public.commitment_sources;
drop policy if exists "commitment sources read assigned" on public.commitment_sources;
create policy "commitment sources read assigned"
on public.commitment_sources for select
using (public.can_access_commitment_by_id(commitment_id));

drop policy if exists "commitment sources insert members" on public.commitment_sources;
drop policy if exists "commitment sources insert admins" on public.commitment_sources;
create policy "commitment sources insert admins"
on public.commitment_sources for insert
with check (public.is_care_space_admin(care_space_id));

drop policy if exists "commitment events read authorized" on public.commitment_events;
drop policy if exists "commitment events read assigned" on public.commitment_events;
create policy "commitment events read assigned"
on public.commitment_events for select
using (public.can_access_commitment_by_id(commitment_id));

drop policy if exists "commitment events append members" on public.commitment_events;
drop policy if exists "commitment events append assigned" on public.commitment_events;
create policy "commitment events append assigned"
on public.commitment_events for insert
with check (
  actor_id = auth.uid()
  and public.can_edit_commitment_by_id(commitment_id)
);

drop policy if exists "translations read authorized" on public.translations;
drop policy if exists "translations read assigned" on public.translations;
create policy "translations read assigned"
on public.translations for select
using (
  public.is_care_space_admin(care_space_id)
  or (commitment_id is not null and public.can_access_commitment_by_id(commitment_id))
);

drop policy if exists "translations write members" on public.translations;
drop policy if exists "translations insert assigned" on public.translations;
create policy "translations insert assigned"
on public.translations for insert
with check (
  public.is_care_space_admin(care_space_id)
  or (commitment_id is not null and public.can_access_commitment_by_id(commitment_id))
);

drop policy if exists "Members can read correction conflicts" on public.commitment_correction_conflicts;
drop policy if exists "correction conflicts read assigned" on public.commitment_correction_conflicts;
create policy "correction conflicts read assigned"
on public.commitment_correction_conflicts for select
using (public.can_access_commitment_by_id(commitment_id));

drop policy if exists "Members can create correction conflicts" on public.commitment_correction_conflicts;
drop policy if exists "correction conflicts insert assigned" on public.commitment_correction_conflicts;
create policy "correction conflicts insert assigned"
on public.commitment_correction_conflicts for insert
with check (proposed_by = auth.uid() and public.can_edit_commitment_by_id(commitment_id));

drop policy if exists "escalations read members" on public.escalations;
drop policy if exists "escalations read assigned" on public.escalations;
create policy "escalations read assigned"
on public.escalations for select
using (
  public.is_care_space_admin(care_space_id)
  or (commitment_id is not null and public.can_access_commitment_by_id(commitment_id))
);

drop policy if exists "escalations write members" on public.escalations;
drop policy if exists "escalations insert assigned" on public.escalations;
create policy "escalations insert assigned"
on public.escalations for insert
with check (
  public.is_care_space_admin(care_space_id)
  or (commitment_id is not null and public.can_edit_commitment_by_id(commitment_id))
);

drop policy if exists "receipts read members" on public.accountability_receipts;
drop policy if exists "receipts read own or admins" on public.accountability_receipts;
create policy "receipts read own or admins"
on public.accountability_receipts for select
using (actor_id = auth.uid() or public.is_care_space_admin(care_space_id));

drop policy if exists "receipts append members" on public.accountability_receipts;
drop policy if exists "receipts append own" on public.accountability_receipts;
create policy "receipts append own"
on public.accountability_receipts for insert
with check (actor_id = auth.uid() and public.is_active_care_space_member(care_space_id));

commit;
