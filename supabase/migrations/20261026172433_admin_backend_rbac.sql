-- FESTRONIX admin backend, row-level authorization, and operational APIs.
-- Apply after the existing schema has been created. This migration is safe to rerun.

begin;

-- New Auth users must receive a unique profile roll number even when they are
-- administrative accounts and do not have a student roll number.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_roll_number text := nullif(trim(coalesce(new.raw_user_meta_data->>'roll_number', '')), '');
  v_username text := nullif(lower(trim(coalesce(new.raw_user_meta_data->>'username', ''))), '');
begin
  insert into public.profiles (id, full_name, email, phone, college, roll_number, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'college', 'Vardhaman College of Engineering'),
    coalesce(v_roll_number, 'ACCOUNT-' || upper(left(replace(new.id::text, '-', ''), 12))),
    coalesce(v_username, 'user_' || left(replace(new.id::text, '-', ''), 12))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Keep the application's existing auto-confirm behavior for signups, while
-- allowing Auth invitation links to confirm invited users themselves.
create or replace function public.auto_confirm_new_user()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if new.email_confirmed_at is null and new.invited_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;
revoke all on function public.auto_confirm_new_user() from public, anon, authenticated;

alter table public.events
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists tagline text,
  add column if not exists payment_instructions text,
  add column if not exists faqs jsonb not null default '[]'::jsonb,
  add column if not exists approval_status text not null default 'approved';

alter table public.events drop constraint if exists events_status_check;
alter table public.events drop constraint if exists events_approval_status_check;
alter table public.events
  add constraint events_status_check
  check (status in ('upcoming', 'open', 'full', 'closed', 'completed', 'pending_approval'));
alter table public.events
  add constraint events_approval_status_check
  check (approval_status in ('approved', 'pending', 'rejected'));

alter table public.announcements
  add column if not exists date_display text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.registrations
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists checked_in boolean not null default false,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by text,
  add column if not exists team_code text,
  add column if not exists team_name text,
  add column if not exists department_code text;

alter table public.admin_roles
  add column if not exists username text,
  add column if not exists full_name text not null default '',
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists access_boundary text,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

update public.admin_roles r set
  username = coalesce(nullif(r.username, ''), lower(coalesce(nullif(p.username, ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'admin')) || '_' || left(r.user_id::text, 6)),
  full_name = coalesce(nullif(r.full_name, ''), nullif(p.full_name, ''), nullif(u.raw_user_meta_data->>'full_name', ''), 'Administrator'),
  email = coalesce(nullif(r.email, ''), p.email, u.email),
  phone = coalesce(r.phone, p.phone),
  designation = coalesce(nullif(r.designation, ''), 'Administrator')
from auth.users u
left join public.profiles p on p.id = u.id
where r.user_id = u.id
  and (r.username is null or r.full_name = '' or r.email is null or r.designation is null);

alter table public.admin_roles drop constraint if exists admin_roles_role_check;
alter table public.admin_roles
  add constraint admin_roles_role_check check (role in (
    'super_admin', 'dean_sac', 'connect_club', 'vencorpia',
    'dept_chief_coordinator', 'dept_coordinator', 'event_coordinator',
    'faculty_coord', 'student_coord', 'finance_reviewer',
    'volunteer_checkin', 'checkin_staff'
  ));

create unique index if not exists admin_roles_username_lower_key
  on public.admin_roles (lower(username)) where username is not null and active;
create unique index if not exists admin_roles_email_lower_key
  on public.admin_roles (lower(email)) where email is not null and active;
create unique index if not exists admin_roles_one_active_role_per_user_key
  on public.admin_roles (user_id) where active;
create index if not exists admin_roles_active_department_idx
  on public.admin_roles (department_code, role) where active;
create index if not exists registrations_event_payment_idx
  on public.registrations (event_id, payment_status);
create index if not exists registrations_event_roll_idx
  on public.registrations (event_id, upper(leader_roll));

-- Maintain denormalized department references if a super admin renames a code.
alter table public.events drop constraint if exists events_department_code_fkey;
alter table public.events
  add constraint events_department_code_fkey
  foreign key (department_code) references public.departments(code) on update cascade;
alter table public.admin_roles drop constraint if exists admin_roles_department_code_fkey;
alter table public.admin_roles
  add constraint admin_roles_department_code_fkey
  foreign key (department_code) references public.departments(code) on update cascade;

create table if not exists public.admin_event_assignments (
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (admin_user_id, event_id)
);
create index if not exists admin_event_assignments_event_idx
  on public.admin_event_assignments (event_id, admin_user_id);

insert into public.admin_event_assignments (admin_user_id, event_id, granted_by)
select user_id, event_id, granted_by
from public.admin_roles
where event_id is not null
on conflict (admin_user_id, event_id) do nothing;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_has_role(p_roles text[])
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.admin_roles r
    where r.user_id = (select auth.uid())
      and r.active
      and r.role = any (p_roles)
  );
$$;

create or replace function private.current_is_global_admin()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_user_has_role(array['super_admin', 'dean_sac', 'connect_club', 'vencorpia']);
$$;

create or replace function private.current_is_active_admin()
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_user_has_role(array[
    'super_admin', 'dean_sac', 'connect_club', 'vencorpia',
    'dept_chief_coordinator', 'dept_coordinator', 'event_coordinator',
    'faculty_coord', 'student_coord', 'finance_reviewer',
    'volunteer_checkin', 'checkin_staff'
  ]);
$$;

create or replace function private.can_manage_department(p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin() or exists (
    select 1 from public.admin_roles r
    where r.user_id = (select auth.uid())
      and r.active
      and r.department_code = p_department_code
      and r.role in ('dept_chief_coordinator', 'dept_coordinator')
  );
$$;

create or replace function private.can_manage_event(p_event_id uuid, p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or private.can_manage_department(p_department_code)
    or exists (
      select 1
      from public.admin_roles r
      join public.admin_event_assignments a on a.admin_user_id = r.user_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('event_coordinator', 'faculty_coord', 'student_coord')
        and a.event_id = p_event_id
        and r.department_code = p_department_code
    );
$$;

create or replace function private.can_manage_announcement(p_scope text, p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or (p_scope = 'department' and private.can_manage_department(p_department_code));
$$;

create or replace function private.can_view_registration(p_registration_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.registrations r
    join public.events e on e.id = r.event_id
    where r.id = p_registration_id
      and (
        r.user_id = (select auth.uid())
        or private.current_is_global_admin()
        or private.current_user_has_role(array['finance_reviewer'])
        or private.can_manage_event(e.id, e.department_code)
      )
  );
$$;

create or replace function private.can_check_in_event(p_event_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or private.current_user_has_role(array['volunteer_checkin', 'checkin_staff'])
    or exists (
      select 1 from public.events e
      where e.id = p_event_id
        and private.can_manage_event(e.id, e.department_code)
    );
$$;

revoke all on function private.current_user_has_role(text[]) from public, anon;
revoke all on function private.current_is_global_admin() from public, anon;
revoke all on function private.current_is_active_admin() from public, anon;
revoke all on function private.can_manage_department(text) from public, anon;
revoke all on function private.can_manage_event(uuid, text) from public, anon;
revoke all on function private.can_manage_announcement(text, text) from public, anon;
revoke all on function private.can_view_registration(uuid) from public, anon;
revoke all on function private.can_check_in_event(uuid) from public, anon;
grant execute on function private.current_user_has_role(text[]) to authenticated;
grant execute on function private.current_is_global_admin() to authenticated;
grant execute on function private.current_is_active_admin() to authenticated;
grant execute on function private.can_manage_department(text) to authenticated;
grant execute on function private.can_manage_event(uuid, text) to authenticated;
grant execute on function private.can_manage_announcement(text, text) to authenticated;
grant execute on function private.can_view_registration(uuid) to authenticated;
grant execute on function private.can_check_in_event(uuid) to authenticated;

-- Do not leave older permissive policies active alongside the scoped policies below.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'profiles', 'departments', 'events', 'registrations',
        'registration_members', 'tickets', 'payment_proofs',
        'announcements', 'admin_roles', 'admin_event_assignments', 'audit_logs'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.events enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_members enable row level security;
alter table public.tickets enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.announcements enable row level security;
alter table public.admin_roles enable row level security;
alter table public.admin_event_assignments enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.profiles, public.departments, public.events,
  public.registrations, public.registration_members, public.tickets,
  public.payment_proofs, public.announcements, public.admin_roles,
  public.admin_event_assignments, public.audit_logs from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, phone, college, avatar_url, updated_at) on table public.profiles to authenticated;
grant select on table public.departments to anon, authenticated;
grant select, insert, update, delete on table public.departments to authenticated;
grant select on table public.events to anon, authenticated;
grant insert (
  slug, title, tagline, department_code, category, format, min_team_size,
  max_team_size, fee, capacity, deadline, date_display, time_display, venue,
  description, rules, prizes, eligibility, coordinator_name, coordinator_phone,
  coordinator_email, status, banner_gradient, payment_instructions, faqs, approval_status
) on table public.events to authenticated;
grant update (
  slug, title, tagline, department_code, category, format, min_team_size,
  max_team_size, fee, capacity, deadline, date_display, time_display, venue,
  description, rules, prizes, eligibility, coordinator_name, coordinator_phone,
  coordinator_email, status, banner_gradient, payment_instructions, faqs,
  approval_status, updated_at
) on table public.events to authenticated;
grant select on table public.registrations to authenticated;
grant select on table public.registration_members, public.tickets, public.payment_proofs to authenticated;
grant select, insert, update, delete on table public.announcements to authenticated;
grant select on table public.announcements to anon;
grant select, insert, update, delete on table public.admin_roles to authenticated;
grant select, insert, update, delete on table public.admin_event_assignments to authenticated;
grant select, insert on table public.audit_logs to authenticated;

create policy profiles_read_self_or_global_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.current_is_global_admin());
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy departments_public_read on public.departments
  for select to anon, authenticated using (true);
create policy departments_manage_global on public.departments
  for all to authenticated
  using (private.current_is_global_admin())
  with check (private.current_is_global_admin());

create policy events_public_read on public.events
  for select to anon, authenticated
  using (is_deleted = false and approval_status = 'approved');
create policy events_admin_read on public.events
  for select to authenticated using (private.can_manage_event(id, department_code));
create policy events_insert_department_or_global on public.events
  for insert to authenticated
  with check (
    not is_deleted and (
      private.current_is_global_admin()
      or (private.can_manage_department(department_code) and status = 'pending_approval' and approval_status = 'pending')
    )
  );
create policy events_update_scoped on public.events
  for update to authenticated
  using (private.can_manage_event(id, department_code))
  with check (private.can_manage_event(id, department_code) and not is_deleted);

create policy registrations_read_scoped on public.registrations
  for select to authenticated
  using (private.can_view_registration(id));
create policy registrations_update_scoped on public.registrations
  for update to authenticated
  using (
    private.current_is_global_admin()
    or private.current_user_has_role(array['finance_reviewer'])
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and private.can_manage_event(e.id, e.department_code)
    )
  )
  with check (
    private.current_is_global_admin()
    or private.current_user_has_role(array['finance_reviewer'])
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and private.can_manage_event(e.id, e.department_code)
    )
  );

create policy registration_members_read_scoped on public.registration_members
  for select to authenticated using (private.can_view_registration(registration_id));
create policy tickets_read_scoped on public.tickets
  for select to authenticated using (private.can_view_registration(registration_id));
create policy payment_proofs_read_scoped on public.payment_proofs
  for select to authenticated using (private.can_view_registration(registration_id));
create policy payment_proofs_insert_owner on public.payment_proofs
  for insert to authenticated
  with check (exists (
    select 1 from public.registrations r
    where r.id = registration_id and r.user_id = (select auth.uid())
  ));
create policy payment_proofs_update_reviewers on public.payment_proofs
  for update to authenticated
  using (
    private.current_is_global_admin()
    or private.current_user_has_role(array['finance_reviewer'])
    or exists (
      select 1 from public.registrations r
      join public.events e on e.id = r.event_id
      where r.id = registration_id and private.can_manage_event(e.id, e.department_code)
    )
  )
  with check (
    private.current_is_global_admin()
    or private.current_user_has_role(array['finance_reviewer'])
    or exists (
      select 1 from public.registrations r
      join public.events e on e.id = r.event_id
      where r.id = registration_id and private.can_manage_event(e.id, e.department_code)
    )
  );

create policy announcements_public_read on public.announcements
  for select to anon, authenticated using (true);
create policy announcements_insert_scoped on public.announcements
  for insert to authenticated
  with check (private.can_manage_announcement(scope, department_code));
create policy announcements_update_scoped on public.announcements
  for update to authenticated
  using (private.can_manage_announcement(scope, department_code))
  with check (private.can_manage_announcement(scope, department_code));
create policy announcements_delete_scoped on public.announcements
  for delete to authenticated
  using (private.can_manage_announcement(scope, department_code));

create policy admin_roles_read_self_or_global on public.admin_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or private.current_is_global_admin());
create policy admin_roles_insert_global on public.admin_roles
  for insert to authenticated with check (private.current_is_global_admin());
create policy admin_roles_update_global on public.admin_roles
  for update to authenticated
  using (private.current_is_global_admin())
  with check (private.current_is_global_admin());
create policy admin_roles_delete_global on public.admin_roles
  for delete to authenticated using (private.current_is_global_admin());

create policy admin_assignments_read_self_or_global on public.admin_event_assignments
  for select to authenticated
  using (admin_user_id = (select auth.uid()) or private.current_is_global_admin());
create policy admin_assignments_manage_global on public.admin_event_assignments
  for all to authenticated
  using (private.current_is_global_admin())
  with check (private.current_is_global_admin());

create policy audit_logs_read_admin on public.audit_logs
  for select to authenticated using (private.current_is_active_admin());
create policy audit_logs_insert_admin on public.audit_logs
  for insert to authenticated
  with check (private.current_is_active_admin() and (actor_id is null or actor_id = (select auth.uid())));

-- Payment evidence is private and may only be read by the owner or authorized reviewers.
drop policy if exists payment_screenshots_read_scoped on storage.objects;
drop policy if exists payment_screenshots_insert_owner on storage.objects;
drop policy if exists payment_screenshots_read_scope_guard on storage.objects;
drop policy if exists payment_screenshots_insert_scope_guard on storage.objects;
drop policy if exists payment_screenshots_no_update on storage.objects;
drop policy if exists payment_screenshots_no_delete on storage.objects;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-screenshots', 'payment-screenshots', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy payment_screenshots_read_scoped on storage.objects
  as permissive for select to authenticated
  using (
    bucket_id = 'payment-screenshots'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.registrations r
        where r.payment_screenshot_url = storage.objects.name
          and private.can_view_registration(r.id)
      )
    )
  );
create policy payment_screenshots_insert_owner on storage.objects
  as permissive for insert to authenticated
  with check (
    bucket_id = 'payment-screenshots'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy payment_screenshots_read_scope_guard on storage.objects
  as restrictive for select to authenticated
  using (
    bucket_id <> 'payment-screenshots'
    or (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (
      select 1 from public.registrations r
      where r.payment_screenshot_url = storage.objects.name
        and private.can_view_registration(r.id)
    )
  );
create policy payment_screenshots_insert_scope_guard on storage.objects
  as restrictive for insert to authenticated
  with check (
    bucket_id <> 'payment-screenshots'
    or (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy payment_screenshots_no_update on storage.objects
  as restrictive for update to authenticated
  using (bucket_id <> 'payment-screenshots');
create policy payment_screenshots_no_delete on storage.objects
  as restrictive for delete to authenticated
  using (bucket_id <> 'payment-screenshots');

create or replace function private.guard_event_admin_fields()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if private.current_is_global_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending_approval' or new.approval_status <> 'pending' then
      raise exception 'Department events must be submitted for central approval.';
    end if;
    return new;
  end if;

  if new.approval_status is distinct from old.approval_status
    or new.is_deleted is distinct from old.is_deleted
    or new.deleted_at is distinct from old.deleted_at
    or new.deleted_by is distinct from old.deleted_by then
    raise exception 'Only central administrators can approve or delete events.';
  end if;
  if old.approval_status <> 'approved' and new.status <> 'pending_approval' then
    raise exception 'This event must be approved before it can be opened or closed.';
  end if;
  if new.status = 'pending_approval' and new.approval_status <> 'pending' then
    raise exception 'An approved or rejected event cannot be resubmitted by a department account.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_event_admin_fields on public.events;
create trigger guard_event_admin_fields
  before insert or update on public.events
  for each row execute function private.guard_event_admin_fields();

create or replace function private.soft_delete_event(p_event_id uuid)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then raise exception 'Sign in before deleting an event.'; end if;
  if not private.current_is_global_admin() then raise exception 'Only central administrators can delete events.'; end if;

  update public.events set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  where id = p_event_id and not is_deleted;
  if not found then raise exception 'Event not found or already deleted.'; end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'EVENT_SOFT_DELETED', 'event', p_event_id::text, '{}'::jsonb);
  return jsonb_build_object('success', true, 'eventId', p_event_id);
end;
$$;

create or replace function public.soft_delete_event(p_event_id uuid)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.soft_delete_event(p_event_id); $$;

revoke all on function private.guard_event_admin_fields() from public, anon;
grant execute on function private.guard_event_admin_fields() to authenticated;
revoke all on function private.soft_delete_event(uuid) from public, anon;
grant execute on function private.soft_delete_event(uuid) to authenticated;
revoke all on function public.soft_delete_event(uuid) from public, anon;
grant execute on function public.soft_delete_event(uuid) to authenticated;

-- Registration creation stays atomic, but now derives actor identity and price from trusted state.
drop function if exists public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb);
create or replace function private.create_registration(
  p_event_id uuid,
  p_user_id uuid default null,
  p_buyer_roll text default null,
  p_leader_name text default '',
  p_leader_email text default '',
  p_leader_phone text default '',
  p_leader_college text default '',
  p_leader_roll text default '',
  p_format text default 'individual',
  p_fee integer default 0,
  p_source text default 'online',
  p_payment_status text default 'payment_required',
  p_transaction_id text default null,
  p_payment_screenshot_url text default null,
  p_spot_registered_by uuid default null,
  p_teammates jsonb default '[]'::jsonb,
  p_team_name text default null,
  p_team_code text default null
)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_event public.events%rowtype;
  v_actor uuid := auth.uid();
  v_registration_id uuid;
  v_display_id text;
  v_qr_token text;
  v_payment_status text;
  v_user_id uuid;
  v_teammate jsonb;
  v_roll text;
begin
  if v_actor is null then raise exception 'Sign in before registering.'; end if;
  if p_source is null or p_source not in ('online', 'spot') then raise exception 'Unsupported registration source.'; end if;
  if p_format is null or p_format not in ('individual', 'duo', 'team') then raise exception 'Unsupported participation format.'; end if;
  if jsonb_typeof(coalesce(p_teammates, '[]'::jsonb)) <> 'array' then raise exception 'Teammates must be a list.'; end if;
  if nullif(trim(coalesce(p_leader_name, '')), '') is null then raise exception 'Enter the participant name.'; end if;
  if coalesce(nullif(trim(p_leader_roll), ''), nullif(trim(p_buyer_roll), ''), '') = '' then raise exception 'Enter the participant roll number.'; end if;

  select * into v_event
  from public.events e
  where e.id = p_event_id and not e.is_deleted
  for update;
  if not found then raise exception 'Event not found.'; end if;
  if v_event.status not in ('open', 'upcoming') or v_event.approval_status <> 'approved' then
    raise exception 'This event is not accepting registrations.';
  end if;
  if p_format <> v_event.format then raise exception 'This event does not support the selected participation format.'; end if;
  if v_event.registered_count >= v_event.capacity then
    update public.events set status = 'full' where id = p_event_id;
    return jsonb_build_object('success', false, 'error', 'This event has reached capacity.');
  end if;
  if v_event.deadline is not null and now() > v_event.deadline then
    raise exception 'The registration deadline has passed.';
  end if;

  if p_source = 'spot' then
    if not private.can_manage_event(p_event_id, v_event.department_code) then raise exception 'You are not authorized to create spot registrations for this event.'; end if;
    v_user_id := null;
  else
    if p_user_id is not null and p_user_id <> v_actor then raise exception 'The registration account does not match the signed-in user.'; end if;
    if nullif(trim(coalesce(p_payment_screenshot_url, '')), '') is not null
      and p_payment_screenshot_url not like (v_actor::text || '/%') then
      raise exception 'Payment evidence must be uploaded by the signed-in account.';
    end if;
    v_user_id := v_actor;
  end if;

  if coalesce(p_format, '') = 'individual' and jsonb_array_length(coalesce(p_teammates, '[]'::jsonb)) > 0 then
    raise exception 'Individual registrations cannot include teammates.';
  end if;
  if jsonb_array_length(coalesce(p_teammates, '[]'::jsonb)) + 1 < v_event.min_team_size
    or jsonb_array_length(coalesce(p_teammates, '[]'::jsonb)) + 1 > v_event.max_team_size then
    raise exception 'The team size does not match this event''s rules.';
  end if;

  for v_teammate in select t.value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) as t(value) loop
    v_roll := nullif(upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', ''))), '');
    if v_roll is not null and (
      exists (select 1 from public.registrations r where r.event_id = p_event_id and r.payment_status <> 'rejected'
        and upper(coalesce(r.leader_roll, '')) = v_roll)
      or exists (select 1 from public.registration_members m join public.registrations r on r.id = m.registration_id
        where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(m.roll_number, '')) = v_roll)
    ) then raise exception 'A teammate is already registered for this event.'; end if;
  end loop;

  v_roll := nullif(upper(trim(coalesce(nullif(trim(p_leader_roll), ''), nullif(trim(p_buyer_roll), ''), ''))), '');
  if v_roll is not null and (
    exists (select 1 from public.registrations r where r.event_id = p_event_id and r.payment_status <> 'rejected'
      and (upper(coalesce(r.leader_roll, '')) = v_roll or upper(coalesce(r.buyer_roll, '')) = v_roll))
    or exists (select 1 from public.registration_members m join public.registrations r on r.id = m.registration_id
      where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(m.roll_number, '')) = v_roll)
  ) then raise exception 'This participant is already registered for the event.'; end if;

  v_payment_status := case
    when v_event.fee = 0 then 'not_applicable'
    when p_source = 'spot' and p_payment_status = 'verified' then 'verified'
    when p_source = 'spot' then coalesce(p_payment_status, 'payment_required')
    when nullif(trim(coalesce(p_transaction_id, '')), '') is not null or nullif(trim(coalesce(p_payment_screenshot_url, '')), '') is not null then 'verification_pending'
    else 'payment_required'
  end;
  if v_payment_status not in ('payment_required', 'verification_pending', 'verified', 'rejected', 'not_applicable') then
    raise exception 'Unsupported payment status.';
  end if;

  v_display_id := public.generate_display_id();
  v_qr_token := public.generate_qr_token(v_display_id);
  insert into public.registrations (
    display_id, user_id, buyer_roll, event_id, event_title,
    leader_name, leader_email, leader_phone, leader_college, leader_roll,
    format, fee, source, payment_status, transaction_id,
    payment_screenshot_url, spot_registered_by, team_name, team_code,
    department_code, checked_in
  ) values (
    v_display_id, v_user_id, p_buyer_roll, p_event_id, v_event.title,
    p_leader_name, p_leader_email, p_leader_phone, p_leader_college, p_leader_roll,
    p_format, v_event.fee, p_source, v_payment_status, p_transaction_id,
    p_payment_screenshot_url, case when p_source = 'spot' then v_actor else null end,
    nullif(trim(coalesce(p_team_name, '')), ''), nullif(trim(coalesce(p_team_code, '')), ''),
    v_event.department_code, false
  ) returning id into v_registration_id;

  for v_teammate in select t.value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) as t(value) loop
    insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
    values (
      v_registration_id,
      coalesce(v_teammate->>'name', ''),
      coalesce(v_teammate->>'email', ''),
      coalesce(v_teammate->>'phone', ''),
      coalesce(v_teammate->>'college', ''),
      coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', '')
    );
  end loop;

  insert into public.tickets (registration_id, qr_token) values (v_registration_id, v_qr_token);
  update public.events
  set registered_count = registered_count + 1,
      status = case when registered_count + 1 >= capacity then 'full' else status end,
      updated_at = now()
  where id = p_event_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'REGISTRATION_CREATED', 'registration', v_registration_id::text,
    jsonb_build_object('display_id', v_display_id, 'event_id', p_event_id, 'source', p_source));

  return jsonb_build_object('success', true, 'registration', jsonb_build_object(
    'id', v_display_id, 'uuid', v_registration_id, 'eventId', p_event_id,
    'eventTitle', v_event.title, 'leaderName', p_leader_name, 'leaderEmail', p_leader_email,
    'leaderPhone', p_leader_phone, 'leaderCollege', p_leader_college,
    'leaderRoll', p_leader_roll, 'teamName', nullif(trim(coalesce(p_team_name, '')), ''),
    'teamCode', nullif(trim(coalesce(p_team_code, '')), ''), 'format', p_format, 'fee', v_event.fee,
    'source', p_source, 'paymentStatus', v_payment_status,
    'transactionId', p_transaction_id, 'qrToken', v_qr_token,
    'checkedIn', false, 'registrationDate', now()
  ));
end;
$$;

create or replace function public.create_registration(
  p_event_id uuid,
  p_user_id uuid default null,
  p_buyer_roll text default null,
  p_leader_name text default '',
  p_leader_email text default '',
  p_leader_phone text default '',
  p_leader_college text default '',
  p_leader_roll text default '',
  p_format text default 'individual',
  p_fee integer default 0,
  p_source text default 'online',
  p_payment_status text default 'payment_required',
  p_transaction_id text default null,
  p_payment_screenshot_url text default null,
  p_spot_registered_by uuid default null,
  p_teammates jsonb default '[]'::jsonb,
  p_team_name text default null,
  p_team_code text default null
)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$
  select private.create_registration(
    p_event_id, p_user_id, p_buyer_roll, p_leader_name, p_leader_email,
    p_leader_phone, p_leader_college, p_leader_roll, p_format, p_fee,
    p_source, p_payment_status, p_transaction_id, p_payment_screenshot_url,
    p_spot_registered_by, p_teammates, p_team_name, p_team_code
  );
$$;

create or replace function private.check_in_registration(p_qr_token_or_id text, p_staff_name text default 'Desk')
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_ticket public.tickets%rowtype;
  v_reg public.registrations%rowtype;
  v_staff text;
  v_query text := lower(trim(coalesce(p_qr_token_or_id, '')));
begin
  if auth.uid() is null then raise exception 'Sign in before checking in a participant.'; end if;
  if v_query = '' then return jsonb_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'Scan a pass or enter a registration ID.'); end if;

  select t.* into v_ticket
  from public.tickets t
  join public.registrations r on r.id = t.registration_id
  where lower(t.qr_token) = v_query or lower(r.display_id) = v_query
  limit 1
  for update of t;
  if not found then return jsonb_build_object('success', false, 'status', 'NOT_FOUND', 'message', 'No registration matches that pass or ID.'); end if;

  select * into v_reg from public.registrations where id = v_ticket.registration_id for update;
  if not private.can_check_in_event(v_reg.event_id) then raise exception 'You are not authorized to check in this event.'; end if;

  select r.full_name into v_staff from public.admin_roles r
  where r.user_id = auth.uid() and r.active limit 1;
  v_staff := coalesce(v_staff, p_staff_name, 'Event Staff');

  if v_reg.payment_status in ('verification_pending', 'rejected', 'payment_required') then
    return jsonb_build_object('success', false, 'status', 'PAYMENT_PENDING',
      'message', 'Entry blocked until payment is verified.');
  end if;
  if v_ticket.checked_in then
    return jsonb_build_object('success', false, 'status', 'ALREADY_CHECKED_IN',
      'message', 'This ticket has already been checked in.', 'checkedInAt', v_ticket.checked_in_at,
      'registration', jsonb_build_object(
        'id', v_reg.display_id, 'eventTitle', v_reg.event_title,
        'leaderName', v_reg.leader_name, 'leaderRoll', v_reg.leader_roll,
        'leaderCollege', v_reg.leader_college, 'paymentStatus', v_reg.payment_status,
        'checkedIn', true, 'checkedInAt', v_ticket.checked_in_at,
        'checkedInBy', v_ticket.checked_in_by, 'qrToken', v_ticket.qr_token
      ));
  end if;

  update public.tickets set checked_in = true, checked_in_at = now(), checked_in_by = v_staff where id = v_ticket.id;
  update public.registrations set checked_in = true, checked_in_at = now(), checked_in_by = v_staff, updated_at = now() where id = v_reg.id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'REGISTRATION_CHECKED_IN', 'registration', v_reg.id::text,
    jsonb_build_object('display_id', v_reg.display_id, 'event_id', v_reg.event_id));

  return jsonb_build_object('success', true, 'status', 'VALID',
    'message', 'Access granted. Welcome ' || v_reg.leader_name || '.',
    'registration', jsonb_build_object(
      'id', v_reg.display_id, 'eventTitle', v_reg.event_title,
      'leaderName', v_reg.leader_name, 'paymentStatus', v_reg.payment_status,
      'leaderRoll', v_reg.leader_roll, 'leaderCollege', v_reg.leader_college,
      'checkedIn', true, 'checkedInAt', now(), 'checkedInBy', v_staff,
      'qrToken', v_ticket.qr_token
    ));
end;
$$;

create or replace function private.review_registration_payment(
  p_display_id text,
  p_status text,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_reg public.registrations%rowtype;
  v_reviewer text;
begin
  if auth.uid() is null then raise exception 'Sign in before reviewing payments.'; end if;
  if p_status not in ('verified', 'rejected', 'verification_pending', 'payment_required', 'not_applicable') then
    raise exception 'Unsupported payment status.';
  end if;

  select * into v_reg from public.registrations where display_id = p_display_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  if not private.current_is_global_admin()
    and not private.current_user_has_role(array['finance_reviewer'])
    and not exists (
      select 1 from public.events e where e.id = v_reg.event_id
        and private.can_manage_event(e.id, e.department_code)
    ) then
    raise exception 'You are not authorized to review this registration.';
  end if;

  select r.full_name into v_reviewer from public.admin_roles r
  where r.user_id = auth.uid() and r.active limit 1;
  v_reviewer := coalesce(v_reviewer, 'FESTRONIX Admin');

  update public.registrations set
    payment_status = p_status,
    verified_by = v_reviewer,
    verified_at = case when p_status in ('verified', 'rejected') then now() else null end,
    rejection_reason = case when p_status = 'rejected' then nullif(trim(coalesce(p_rejection_reason, '')), '') else null end,
    updated_at = now()
  where id = v_reg.id;

  update public.payment_proofs set
    status = case when p_status = 'verified' then 'verified' when p_status = 'rejected' then 'rejected' else 'pending' end,
    reviewed_by = auth.uid(), reviewer_name = v_reviewer,
    rejection_reason = case when p_status = 'rejected' then nullif(trim(coalesce(p_rejection_reason, '')), '') else null end,
    reviewed_at = case when p_status in ('verified', 'rejected') then now() else null end
  where registration_id = v_reg.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'PAYMENT_' || upper(p_status), 'registration', v_reg.id::text,
    jsonb_build_object('display_id', v_reg.display_id, 'status', p_status,
      'reason', case when p_status = 'rejected' then nullif(trim(coalesce(p_rejection_reason, '')), '') else null end));

  return jsonb_build_object('success', true, 'displayId', v_reg.display_id, 'status', p_status,
    'verifiedBy', v_reviewer, 'verifiedAt', now());
end;
$$;

create or replace function public.review_registration_payment(
  p_display_id text,
  p_status text,
  p_rejection_reason text default null
)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.review_registration_payment(p_display_id, p_status, p_rejection_reason); $$;

create or replace function public.check_in_registration(p_qr_token_or_id text, p_staff_name text default 'Desk')
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.check_in_registration(p_qr_token_or_id, p_staff_name); $$;

create or replace function private.toggle_check_in_registration(p_display_id text, p_staff_name text default 'Desk')
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_reg public.registrations%rowtype;
  v_ticket public.tickets%rowtype;
  v_checked_in boolean;
  v_staff text;
begin
  if auth.uid() is null then raise exception 'Sign in before changing check-in status.'; end if;
  select * into v_reg from public.registrations where display_id = p_display_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  if not private.can_check_in_event(v_reg.event_id) then raise exception 'You are not authorized to manage check-in for this event.'; end if;
  select * into v_ticket from public.tickets where registration_id = v_reg.id for update;
  v_checked_in := not coalesce(v_reg.checked_in, v_ticket.checked_in, false);
  if v_checked_in and v_reg.payment_status not in ('verified', 'not_applicable') then
    raise exception 'Payment must be verified before this participant can be checked in.';
  end if;
  select r.full_name into v_staff from public.admin_roles r where r.user_id = auth.uid() and r.active limit 1;
  v_staff := coalesce(v_staff, p_staff_name, 'Event Staff');
  update public.registrations set checked_in = v_checked_in,
    checked_in_at = case when v_checked_in then now() else null end,
    checked_in_by = case when v_checked_in then v_staff else null end,
    updated_at = now() where id = v_reg.id;
  update public.tickets set checked_in = v_checked_in,
    checked_in_at = case when v_checked_in then now() else null end,
    checked_in_by = case when v_checked_in then v_staff else null end
  where registration_id = v_reg.id;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), case when v_checked_in then 'REGISTRATION_CHECKED_IN' else 'REGISTRATION_CHECKIN_REVERSED' end,
    'registration', v_reg.id::text, jsonb_build_object('display_id', v_reg.display_id, 'event_id', v_reg.event_id));
  return jsonb_build_object('success', true, 'checkedIn', v_checked_in);
end;
$$;

revoke all on function private.check_in_registration(text, text) from public, anon;
revoke all on function private.toggle_check_in_registration(text, text) from public, anon;
revoke all on function private.review_registration_payment(text, text, text) from public, anon;
grant execute on function private.check_in_registration(text, text) to authenticated;
grant execute on function private.toggle_check_in_registration(text, text) to authenticated;
grant execute on function private.review_registration_payment(text, text, text) to authenticated;

create or replace function public.toggle_check_in_registration(p_display_id text, p_staff_name text default 'Desk')
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.toggle_check_in_registration(p_display_id, p_staff_name); $$;

revoke all on function private.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public, anon;
grant execute on function private.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to authenticated;
revoke all on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public, anon;
grant execute on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to authenticated;
revoke all on function public.check_in_registration(text, text) from public, anon;
grant execute on function public.check_in_registration(text, text) to authenticated;
revoke all on function public.toggle_check_in_registration(text, text) from public, anon;
grant execute on function public.toggle_check_in_registration(text, text) to authenticated;
revoke all on function public.review_registration_payment(text, text, text) from public, anon;
grant execute on function public.review_registration_payment(text, text, text) to authenticated;
revoke all on function public.get_user_role(uuid) from public, anon, authenticated;
revoke all on function public.is_admin(uuid) from public, anon, authenticated;
revoke all on function public.is_global_admin(uuid) from public, anon, authenticated;

commit;
