-- ==============================================================================
-- FESTRONIX 2026: PROVISION ADMIN USERS & UNLOCK ADMIN PORTAL CRUD
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Ensure schema columns exist across all operational tables
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS date_display TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS checked_in_by TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_code TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_name TEXT;

-- 3. DROP ALL RESTRICTIVE CHECK CONSTRAINTS & CASCADING FOREIGN KEYS
-- Drop the check constraint so any role name used by the frontend is allowed
ALTER TABLE public.admin_roles DROP CONSTRAINT IF EXISTS admin_roles_role_check;

-- Ensure foreign keys from announcements & certificates cascade cleanly on event deletion
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_event_id_fkey;
ALTER TABLE public.announcements 
  ADD CONSTRAINT announcements_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_event_id_fkey;
ALTER TABLE public.certificates 
  ADD CONSTRAINT certificates_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 4. FIX PROFILES UNIQUE ROLL NUMBER CONSTRAINT & TRIGGER
-- Convert empty strings to NULL so they do not collide in unique indexes
UPDATE public.profiles SET roll_number = NULL WHERE roll_number = '';

-- Replace roll number unique index with a partial index that only checks non-null & non-empty
DROP INDEX IF EXISTS public.idx_profiles_roll_number;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_roll_number 
  ON public.profiles(UPPER(roll_number)) 
  WHERE roll_number IS NOT NULL AND roll_number <> '';

-- Update the new-user trigger so it cleanly handles NULL / blank roll numbers and never crashes auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_roll TEXT;
BEGIN
  v_roll := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'roll_number', '')), '');
  INSERT INTO public.profiles (id, full_name, email, phone, college, roll_number, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', 'Vardhaman College of Engineering'),
    v_roll,
    COALESCE(NEW.raw_user_meta_data->>'username', LOWER(COALESCE(v_roll, SPLIT_PART(NEW.email, '@', 1))))
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    username = EXCLUDED.username,
    roll_number = EXCLUDED.roll_number;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail-safe: Never let profile insert failure prevent auth user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Helper function to create or update an admin user in auth.users, auth.identities, profiles & admin_roles
CREATE OR REPLACE FUNCTION public.provision_festronix_admin(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_username TEXT,
  p_role TEXT,
  p_designation TEXT,
  p_department_code TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT '+91 98480 00000'
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_pw TEXT;
  v_admin_roll TEXT;
BEGIN
  v_admin_roll := 'ADMIN_' || upper(p_username);
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(p_email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      lower(p_email),
      v_encrypted_pw,
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'full_name', p_full_name, 
        'username', p_username, 
        'role', p_role, 
        'department_code', p_department_code,
        'roll_number', v_admin_roll
      ),
      now(),
      now(),
      '', '', '', ''
    );
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
      raw_user_meta_data = jsonb_build_object(
        'full_name', p_full_name, 
        'username', p_username, 
        'role', p_role, 
        'department_code', p_department_code,
        'roll_number', v_admin_roll
      ),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Ensure identity exists in auth.identities
  BEGIN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    )
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      identity_data = jsonb_build_object('sub', v_user_id::text, 'email', lower(p_email)),
      updated_at = now();
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Ensure profile exists in public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    college,
    roll_number,
    username
  ) VALUES (
    v_user_id,
    p_full_name,
    lower(p_email),
    p_phone,
    'Vardhaman College of Engineering',
    v_admin_roll,
    lower(p_username)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    username = EXCLUDED.username,
    roll_number = EXCLUDED.roll_number;

  -- Ensure entry exists in public.admin_roles
  DELETE FROM public.admin_roles WHERE user_id = v_user_id;
  INSERT INTO public.admin_roles (
    user_id,
    role,
    department_code,
    designation
  ) VALUES (
    v_user_id,
    p_role,
    p_department_code,
    p_designation
  );

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Provision All Preset Admin Accounts
DO $$
BEGIN
  -- 6.1 Super Admins / SAC Central Leadership
  PERFORM public.provision_festronix_admin(
    'dean.sac@vardhaman.org',
    'deansac2026',
    'Md. Asif',
    'dean_sac',
    'dean_sac',
    'Dean, Student Activity Council (SAC)',
    NULL,
    '+91 98480 11001'
  );

  PERFORM public.provision_festronix_admin(
    'connect.club@vardhaman.org',
    'connect2026',
    'Himavardhan & Core Team',
    'connect_club',
    'connect_club',
    'President & Lead Organizer, CONNECT Club (SAC)',
    NULL,
    '+91 98480 77001'
  );

  PERFORM public.provision_festronix_admin(
    'vencorpia@vardhaman.org',
    'vencorpia2026',
    'Vencorpia Executive Board',
    'vencorpia',
    'vencorpia',
    'Central Student Leadership, VENCORPIA',
    NULL,
    '+91 98480 88001'
  );

  -- 6.2 Central Operations & Finance Reviewers
  PERFORM public.provision_festronix_admin(
    'accounts.fest@vardhaman.org',
    'finance2026',
    'VCE Accounts & Finance Desk',
    'finance_reviewer',
    'finance_reviewer',
    'Central Payment Review Officer, FESTRONIX',
    NULL,
    '+91 98480 55001'
  );

  PERFORM public.provision_festronix_admin(
    'volunteers.fest@vardhaman.org',
    'volunteer2026',
    'SAC Student Volunteer Crew',
    'volunteer_staff',
    'volunteer_checkin',
    'Gate Entry & Ticketing Volunteer',
    NULL,
    '+91 98480 66001'
  );

  PERFORM public.provision_festronix_admin(
    'eventcoord.fest@vardhaman.org',
    'eventcoord2026',
    'Event Operations Team',
    'event_coord',
    'event_coordinator',
    'Lead Event Operations Coordinator',
    'CSE',
    '+91 98480 33001'
  );

  -- 6.3 Department Chief Coordinators / HODs (9 Departments)
  PERFORM public.provision_festronix_admin(
    'cse.festronix@vardhaman.org',
    'cse2026',
    'Dr. K. S. Reddy',
    'hod_cse',
    'dept_chief_coordinator',
    'Department Chief Coordinator (CSE)',
    'CSE',
    '+91 98480 22001'
  );

  PERFORM public.provision_festronix_admin(
    'csd.festronix@vardhaman.org',
    'csd2026',
    'Dr. S. Radhika',
    'hod_csd',
    'dept_chief_coordinator',
    'Department Chief Coordinator (CSD)',
    'CSD',
    '+91 98480 22009'
  );

  PERFORM public.provision_festronix_admin(
    'csm.festronix@vardhaman.org',
    'csm2026',
    'Dr. V. Prasad',
    'hod_csm',
    'dept_chief_coordinator',
    'Department Chief Coordinator (CSM)',
    'CSM',
    '+91 98480 22007'
  );

  PERFORM public.provision_festronix_admin(
    'it.festronix@vardhaman.org',
    'it2026',
    'Prof. Anitha Sharma',
    'hod_it',
    'dept_chief_coordinator',
    'Department Chief Coordinator (IT)',
    'IT',
    '+91 98480 22002'
  );

  PERFORM public.provision_festronix_admin(
    'mechanical.festronix@vardhaman.org',
    'mechanical2026',
    'Dr. C. H. Rao',
    'hod_mechanical',
    'dept_chief_coordinator',
    'Department Chief Coordinator (MECHANICAL)',
    'MECH',
    '+91 98480 22005'
  );

  PERFORM public.provision_festronix_admin(
    'civil.festronix@vardhaman.org',
    'civil2026',
    'Prof. P. Sunitha',
    'hod_civil',
    'dept_chief_coordinator',
    'Department Chief Coordinator (CIVIL)',
    'CIVIL',
    '+91 98480 22006'
  );

  PERFORM public.provision_festronix_admin(
    'eee.festronix@vardhaman.org',
    'eee2026',
    'Dr. B. Srinivas',
    'hod_eee',
    'dept_chief_coordinator',
    'Department Chief Coordinator (EEE)',
    'EEE',
    '+91 98480 22004'
  );

  PERFORM public.provision_festronix_admin(
    'ece.festronix@vardhaman.org',
    'ece2026',
    'Dr. M. V. Ramana',
    'hod_ece',
    'dept_chief_coordinator',
    'Department Chief Coordinator (ECE)',
    'ECE',
    '+91 98480 22003'
  );

  PERFORM public.provision_festronix_admin(
    'mba.festronix@vardhaman.org',
    'mba2026',
    'Prof. R. L. Narayana',
    'hod_mba',
    'dept_chief_coordinator',
    'Department Chief Coordinator (MBA)',
    'MBA',
    '+91 98480 22008'
  );
END $$;

-- 7. Helper Functions for Role Authorization
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_global_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = p_user_id 
    AND role IN ('super_admin', 'dean_sac', 'connect_club', 'vencorpia')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Polish RLS Policies for Robust Operations
-- 8.1 EVENTS RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are publicly readable" ON public.events;
CREATE POLICY "Events are publicly readable" ON public.events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Coordinators and admins can update events" ON public.events;
CREATE POLICY "Coordinators and admins can update events" ON public.events FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Global admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Allow event deletion" ON public.events;
CREATE POLICY "Allow event deletion" ON public.events FOR DELETE USING (true);

-- 8.2 ANNOUNCEMENTS RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Announcements are publicly readable" ON public.announcements;
CREATE POLICY "Announcements are publicly readable" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
CREATE POLICY "Admins can create announcements" ON public.announcements FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE USING (true);

-- 8.3 REGISTRATIONS RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can update registrations" ON public.registrations;
CREATE POLICY "Admins can update registrations" ON public.registrations FOR UPDATE USING (true);

-- 8.4 AUDIT LOGS RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert audit logs" ON public.audit_logs;
CREATE POLICY "Anyone can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 8.5 DEPARTMENTS RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Departments are publicly readable" ON public.departments;
CREATE POLICY "Departments are publicly readable" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
CREATE POLICY "Admins can manage departments" ON public.departments FOR ALL USING (true);

-- ==============================================================================
-- 9. Verification Summary
-- ==============================================================================
SELECT 
  u.email, 
  ar.role, 
  ar.department_code, 
  ar.designation,
  p.roll_number,
  u.email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users u
JOIN public.admin_roles ar ON ar.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY ar.role, u.email;
