-- Prevent duplicate active portal usernames and emails even when two admin
-- requests arrive at the same time. This intentionally does not delete or
-- rewrite historical duplicate rows; it blocks new duplicates safely.

create or replace function public.prevent_duplicate_active_admin_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if coalesce(new.active, false) then
    if nullif(trim(new.username), '') is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('admin-username:' || lower(trim(new.username)), 0)
      );

      if exists (
        select 1
        from public.admin_roles existing
        where existing.active
          and existing.user_id <> new.user_id
          and lower(trim(existing.username)) = lower(trim(new.username))
      ) then
        raise exception 'admin username already exists'
          using errcode = '23505';
      end if;
    end if;

    if nullif(trim(new.email), '') is not null then
      perform pg_advisory_xact_lock(
        hashtextextended('admin-email:' || lower(trim(new.email)), 0)
      );

      if exists (
        select 1
        from public.admin_roles existing
        where existing.active
          and existing.user_id <> new.user_id
          and lower(trim(existing.email)) = lower(trim(new.email))
      ) then
        raise exception 'admin email already exists'
          using errcode = '23505';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists admin_roles_prevent_duplicate_active_identity on public.admin_roles;

create trigger admin_roles_prevent_duplicate_active_identity
before insert or update of username, email, active on public.admin_roles
for each row
execute function public.prevent_duplicate_active_admin_identity();
