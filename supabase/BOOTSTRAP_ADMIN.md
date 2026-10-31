# Supabase backend activation

The application is configured to use Supabase for admin authentication and operational data. Apply the migration and deploy the admin account function to the Supabase project that matches the frontend's `VITE_SUPABASE_URL` before using the portals.

## Deploy the database and function

From the repository root, sign in to the Supabase CLI and link the existing project. Use the project reference from the Supabase project URL; do not put a service-role key in a `VITE_` variable.

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy admin-users --use-api
```

The `admin-users` function uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` runtime secret. Keep it server-side. Configure a production SMTP provider and the correct Auth site/redirect URLs in Supabase before relying on email invitations.

## Create the first super admin

1. In Supabase Dashboard, create and confirm the first account under **Authentication → Users**. Use an individual, controlled email address and a strong password.
2. In **SQL Editor**, run the block below after replacing the three marked values. It creates the super-admin role and synchronizes the account profile. It refuses to create a duplicate active admin or username.
3. Sign in at the FESTRONIX admin portal with that email and password. Create subsequent accounts from the Super Admin portal; accounts are invited by email unless an initial password is explicitly supplied.

```sql
do $$
declare
  v_email text := lower('dean.sac@vardhaman.org');
  v_username text := lower('dean_sac');
  v_full_name text := 'asif';
  v_user_id uuid;
begin
  select id into strict v_user_id
  from auth.users
  where lower(email) = v_email
    and email_confirmed_at is not null;

  if exists (
    select 1 from public.admin_roles
    where user_id = v_user_id and active
  ) then
    raise exception 'This account already has an active admin role.';
  end if;
  if exists (
    select 1 from public.admin_roles
    where lower(username) = v_username and active
  ) or exists (
    select 1 from public.profiles
    where lower(username) = v_username and id <> v_user_id
  ) then
    raise exception 'Choose a username that is not already in use.';
  end if;

  insert into public.profiles (
    id, full_name, email, phone, college, username, roll_number, updated_at
  ) values (
    v_user_id, v_full_name, v_email, '', 'Vardhaman College of Engineering', v_username,
    'ADMIN-' || upper(left(replace(v_user_id::text, '-', ''), 12)), now()
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    username = excluded.username,
    roll_number = excluded.roll_number,
    updated_at = now();

  insert into public.admin_roles (
    user_id, username, full_name, email, role, designation, active
  ) values (
    v_user_id, v_username, v_full_name, v_email,
    'super_admin', 'System Administrator', true
  );
end $$;
```

The password is never stored in `admin_roles` or this repository. Keep database credentials, service-role keys, and Auth user passwords out of source control and frontend configuration.
