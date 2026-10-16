-- ============================================================
-- FESTRONIX DATABASE SCHEMA
-- Supabase (PostgreSQL) — Full Schema + RLS + Functions
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  college TEXT NOT NULL DEFAULT 'Vardhaman College of Engineering',
  roll_number TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint on roll_number 
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_roll_number ON public.profiles(UPPER(roll_number));

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, college, roll_number, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', 'Vardhaman College of Engineering'),
    COALESCE(NEW.raw_user_meta_data->>'roll_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', LOWER(COALESCE(NEW.raw_user_meta_data->>'roll_number', '')))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-confirm student delegates upon signup (eliminates "Email not confirmed" roadblocks)
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_auto_confirm_new_user ON auth.users;
CREATE TRIGGER tr_auto_confirm_new_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

-- Auto-confirm all existing users in auth.users
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  chief_coordinator TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  icon_name TEXT DEFAULT 'Building',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ADMIN ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN (
    'super_admin', 'dean_sac', 'connect_club', 'vencorpia',
    'dept_coordinator', 'event_coordinator', 'finance_reviewer', 'checkin_staff'
  )),
  department_code TEXT REFERENCES public.departments(code),
  event_id UUID,  -- FK added after events table
  granted_by UUID REFERENCES auth.users(id),
  designation TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role, department_code)
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);

-- ============================================================
-- 4. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  department_code TEXT NOT NULL REFERENCES public.departments(code),
  category TEXT NOT NULL CHECK (category IN (
    'technical', 'workshop', 'hackathon', 'non-technical', 'gaming', 'departmental'
  )),
  format TEXT NOT NULL CHECK (format IN ('individual', 'duo', 'team')),
  min_team_size INT NOT NULL DEFAULT 1,
  max_team_size INT NOT NULL DEFAULT 1,
  fee INT NOT NULL DEFAULT 0,
  capacity INT NOT NULL DEFAULT 100,
  registered_count INT NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  date_display TEXT NOT NULL DEFAULT '',
  time_display TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  rules JSONB DEFAULT '[]'::jsonb,
  prizes JSONB DEFAULT '{}'::jsonb,
  eligibility TEXT DEFAULT '',
  coordinator_name TEXT DEFAULT '',
  coordinator_phone TEXT DEFAULT '',
  coordinator_email TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN (
    'upcoming', 'open', 'full', 'closed', 'completed'
  )),
  banner_gradient TEXT DEFAULT 'linear-gradient(135deg, #00f0ff 0%, #7928ca 100%)',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add FK from admin_roles.event_id to events.id
ALTER TABLE public.admin_roles 
  ADD CONSTRAINT fk_admin_roles_event_id 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_department_code ON public.events(department_code);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);

-- ============================================================
-- 5. REGISTRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_id TEXT UNIQUE NOT NULL,  -- e.g. FEST-2026-9042
  user_id UUID REFERENCES auth.users(id),
  buyer_roll TEXT,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  leader_name TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT DEFAULT '',
  leader_college TEXT DEFAULT '',
  leader_roll TEXT DEFAULT '',
  format TEXT NOT NULL CHECK (format IN ('individual', 'duo', 'team')),
  fee INT NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'online' CHECK (source IN ('online', 'spot')),
  payment_status TEXT NOT NULL DEFAULT 'payment_required' CHECK (payment_status IN (
    'payment_required', 'verification_pending', 'verified', 'rejected', 'not_applicable'
  )),
  transaction_id TEXT,
  payment_screenshot_url TEXT,
  rejection_reason TEXT,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  spot_registered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_source ON public.registrations(source);

-- ============================================================
-- 6. REGISTRATION MEMBERS (Teammates)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.registration_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  college TEXT DEFAULT '',
  roll_number TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_members_registration_id ON public.registration_members(registration_id);

-- ============================================================
-- 7. TICKETS (QR Tokens + Check-in)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL UNIQUE REFERENCES public.registrations(id) ON DELETE CASCADE,
  qr_token TEXT UNIQUE NOT NULL,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_qr_token ON public.tickets(qr_token);

-- ============================================================
-- 8. PAYMENT PROOFS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID NOT NULL REFERENCES public.registrations(id) ON DELETE CASCADE,
  screenshot_path TEXT NOT NULL,
  transaction_ref TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewer_name TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_proofs_registration_id ON public.payment_proofs(registration_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON public.payment_proofs(status);

-- ============================================================
-- 9. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('urgent', 'general', 'prize', 'workshop')),
  scope TEXT NOT NULL DEFAULT 'fest-wide' CHECK (scope IN ('fest-wide', 'department', 'event')),
  department_code TEXT REFERENCES public.departments(code),
  event_id UUID REFERENCES public.events(id),
  published_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_scope ON public.announcements(scope);

-- ============================================================
-- 10. CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id UUID REFERENCES public.registrations(id),
  user_id UUID REFERENCES auth.users(id),
  event_id UUID REFERENCES public.events(id),
  file_path TEXT NOT NULL,
  issue_status TEXT DEFAULT 'issued' CHECK (issue_status IN ('issued', 'revoked')),
  issued_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. SPONSORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('platinum', 'gold', 'silver', 'bronze')),
  website_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 12. AUDIT LOGS (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),
  actor_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Generate a display ID for registrations: FEST-2026-XXXX
CREATE OR REPLACE FUNCTION public.generate_display_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FEST-2026-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate a QR token for tickets
CREATE OR REPLACE FUNCTION public.generate_qr_token(display_id TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'FEST26-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 7)) || '-' || SUBSTR(display_id, LENGTH(display_id) - 3);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ATOMIC REGISTRATION FUNCTION
-- Prevents overbooking via serialized capacity check
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_registration(
  p_event_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_buyer_roll TEXT DEFAULT NULL,
  p_leader_name TEXT DEFAULT '',
  p_leader_email TEXT DEFAULT '',
  p_leader_phone TEXT DEFAULT '',
  p_leader_college TEXT DEFAULT '',
  p_leader_roll TEXT DEFAULT '',
  p_format TEXT DEFAULT 'individual',
  p_fee INT DEFAULT 0,
  p_source TEXT DEFAULT 'online',
  p_payment_status TEXT DEFAULT 'payment_required',
  p_transaction_id TEXT DEFAULT NULL,
  p_payment_screenshot_url TEXT DEFAULT NULL,
  p_spot_registered_by UUID DEFAULT NULL,
  p_teammates JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_event RECORD;
  v_display_id TEXT;
  v_qr_token TEXT;
  v_reg_id UUID;
  v_teammate JSONB;
  v_event_title TEXT;
BEGIN
  -- Lock the event row to prevent race conditions
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id FOR UPDATE;
  
  IF v_event IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event not found.');
  END IF;

  -- Check event status
  IF v_event.status NOT IN ('open', 'upcoming') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Event is not accepting registrations (status: ' || v_event.status || ').');
  END IF;

  -- Check capacity
  IF v_event.registered_count >= v_event.capacity THEN
    -- Also update status to 'full'
    UPDATE public.events SET status = 'full' WHERE id = p_event_id;
    RETURN jsonb_build_object('success', false, 'error', 'Event is full. No more registrations accepted.');
  END IF;

  -- Check deadline
  IF v_event.deadline IS NOT NULL AND NOW() > v_event.deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'Registration deadline has passed.');
  END IF;

  -- Generate IDs
  v_display_id := public.generate_display_id();
  v_qr_token := public.generate_qr_token(v_display_id);
  v_event_title := v_event.title;

  -- Determine payment status for free events
  IF p_fee = 0 OR v_event.fee = 0 THEN
    p_payment_status := 'not_applicable';
  END IF;

  -- Insert registration
  INSERT INTO public.registrations (
    display_id, user_id, buyer_roll, event_id, event_title,
    leader_name, leader_email, leader_phone, leader_college, leader_roll,
    format, fee, source, payment_status, transaction_id, 
    payment_screenshot_url, spot_registered_by
  ) VALUES (
    v_display_id, p_user_id, p_buyer_roll, p_event_id, v_event_title,
    p_leader_name, p_leader_email, p_leader_phone, p_leader_college, p_leader_roll,
    p_format, p_fee, p_source, p_payment_status, p_transaction_id,
    p_payment_screenshot_url, p_spot_registered_by
  ) RETURNING id INTO v_reg_id;

  -- Insert teammates
  FOR v_teammate IN SELECT * FROM jsonb_array_elements(p_teammates) LOOP
    INSERT INTO public.registration_members (
      registration_id, name, email, phone, college, roll_number
    ) VALUES (
      v_reg_id,
      COALESCE(v_teammate->>'name', ''),
      COALESCE(v_teammate->>'email', ''),
      COALESCE(v_teammate->>'phone', ''),
      COALESCE(v_teammate->>'college', ''),
      COALESCE(v_teammate->>'rollNumber', COALESCE(v_teammate->>'roll_number', ''))
    );
  END LOOP;

  -- Create ticket with QR token
  INSERT INTO public.tickets (registration_id, qr_token)
  VALUES (v_reg_id, v_qr_token);

  -- Increment registered_count atomically
  UPDATE public.events 
  SET registered_count = registered_count + 1,
      status = CASE 
        WHEN registered_count + 1 >= capacity THEN 'full' 
        ELSE status 
      END
  WHERE id = p_event_id;

  -- Return full registration data
  RETURN jsonb_build_object(
    'success', true,
    'registration', jsonb_build_object(
      'id', v_display_id,
      'uuid', v_reg_id,
      'eventId', p_event_id,
      'eventTitle', v_event_title,
      'leaderName', p_leader_name,
      'leaderEmail', p_leader_email,
      'leaderPhone', p_leader_phone,
      'leaderCollege', p_leader_college,
      'leaderRoll', p_leader_roll,
      'format', p_format,
      'fee', p_fee,
      'source', p_source,
      'paymentStatus', p_payment_status,
      'transactionId', p_transaction_id,
      'qrToken', v_qr_token,
      'checkedIn', false,
      'registrationDate', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CHECK-IN FUNCTION
-- Handles duplicate detection and payment validation
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_in_registration(
  p_qr_token_or_id TEXT,
  p_staff_name TEXT DEFAULT 'Desk'
)
RETURNS JSONB AS $$
DECLARE
  v_ticket RECORD;
  v_reg RECORD;
  v_trimmed TEXT;
BEGIN
  v_trimmed := TRIM(p_qr_token_or_id);
  
  -- Find ticket by QR token or registration display_id
  SELECT t.*, r.* INTO v_ticket
  FROM public.tickets t
  JOIN public.registrations r ON r.id = t.registration_id
  WHERE LOWER(t.qr_token) = LOWER(v_trimmed)
     OR LOWER(r.display_id) = LOWER(v_trimmed);

  IF v_ticket IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'NOT_FOUND',
      'message', 'No registration found matching: ' || p_qr_token_or_id
    );
  END IF;

  -- Check payment status
  IF v_ticket.payment_status IN ('verification_pending', 'rejected', 'payment_required') THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'PAYMENT_PENDING',
      'message', 'Entry blocked: Payment is ' || UPPER(REPLACE(v_ticket.payment_status, '_', ' ')) || '. Must be verified first.',
      'registration', to_jsonb(v_ticket)
    );
  END IF;

  -- Check already checked in
  IF v_ticket.checked_in = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'ALREADY_CHECKED_IN',
      'message', 'ALREADY CHECKED IN at ' || COALESCE(v_ticket.checked_in_at::TEXT, 'unknown') || ' by ' || COALESCE(v_ticket.checked_in_by, 'Desk'),
      'registration', to_jsonb(v_ticket)
    );
  END IF;

  -- Mark as checked in
  UPDATE public.tickets 
  SET checked_in = true, 
      checked_in_at = NOW(), 
      checked_in_by = p_staff_name
  WHERE registration_id = v_ticket.registration_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'VALID',
    'message', 'Access Granted! Welcome ' || v_ticket.leader_name || ' (' || v_ticket.event_title || ')',
    'registration', to_jsonb(v_ticket)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER: Get user role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TABLE(role TEXT, department_code TEXT, event_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT ar.role, ar.department_code, ar.event_id
  FROM public.admin_roles ar
  WHERE ar.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER: Check if user has admin role
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER: Check if user has global admin role (dean, connect, vencorpia, super_admin)
-- ============================================================
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

-- ============================================================
-- 10. TEAMS (Industry-Standard Squad & Invite System)
-- ============================================================
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_name TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_code TEXT;
CREATE INDEX IF NOT EXISTS idx_registrations_team_code ON public.registrations(UPPER(team_code));

CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  team_code TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  registration_id TEXT DEFAULT '',
  leader_id UUID REFERENCES auth.users(id),
  leader_name TEXT NOT NULL,
  leader_roll TEXT NOT NULL,
  leader_email TEXT NOT NULL,
  leader_phone TEXT DEFAULT '',
  leader_college TEXT DEFAULT '',
  members JSONB DEFAULT '[]'::jsonb,
  max_team_size INT DEFAULT 4,
  min_team_size INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_code ON public.teams(UPPER(team_code));
CREATE INDEX IF NOT EXISTS idx_teams_event_id ON public.teams(event_id);

-- RPC: Find Team by Code
CREATE OR REPLACE FUNCTION public.find_team_by_code(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_norm TEXT;
  v_team RECORD;
BEGIN
  v_norm := UPPER(REGEXP_REPLACE(p_code, '[^A-Za-z0-9]', '', 'g'));
  
  SELECT * INTO v_team
  FROM public.teams
  WHERE UPPER(REGEXP_REPLACE(team_code, '[^A-Za-z0-9]', '', 'g')) = v_norm
  LIMIT 1;

  IF v_team IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'team', jsonb_build_object(
      'id', v_team.id,
      'teamCode', v_team.team_code,
      'teamName', v_team.team_name,
      'eventId', v_team.event_id,
      'eventTitle', v_team.event_title,
      'registrationId', v_team.registration_id,
      'leaderId', v_team.leader_id,
      'leaderName', v_team.leader_name,
      'leaderRoll', v_team.leader_roll,
      'leaderEmail', v_team.leader_email,
      'leaderPhone', v_team.leader_phone,
      'leaderCollege', v_team.leader_college,
      'members', v_team.members,
      'maxTeamSize', v_team.max_team_size,
      'minTeamSize', v_team.min_team_size,
      'createdAt', v_team.created_at
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create or Reserve Team
CREATE OR REPLACE FUNCTION public.create_or_reserve_team(
  p_team_code TEXT,
  p_team_name TEXT,
  p_event_id TEXT,
  p_event_title TEXT,
  p_leader_name TEXT,
  p_leader_roll TEXT,
  p_leader_email TEXT,
  p_leader_phone TEXT,
  p_leader_college TEXT,
  p_leader_id UUID DEFAULT NULL,
  p_max_team_size INT DEFAULT 4,
  p_min_team_size INT DEFAULT 2
)
RETURNS JSONB AS $$
DECLARE
  v_id TEXT;
  v_norm TEXT;
  v_team RECORD;
BEGIN
  v_norm := UPPER(REGEXP_REPLACE(p_team_code, '[^A-Za-z0-9]', '', 'g'));
  v_id := 'TEAM-' || floor(1000 + random() * 9000)::text;

  INSERT INTO public.teams (
    id, team_code, team_name, event_id, event_title,
    leader_id, leader_name, leader_roll, leader_email, leader_phone,
    leader_college, members, max_team_size, min_team_size, updated_at
  ) VALUES (
    v_id, p_team_code, p_team_name, p_event_id, p_event_title,
    p_leader_id, p_leader_name, p_leader_roll, p_leader_email, p_leader_phone,
    p_leader_college, '[]'::jsonb, p_max_team_size, p_min_team_size, now()
  )
  ON CONFLICT (team_code) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    event_id = EXCLUDED.event_id,
    event_title = EXCLUDED.event_title,
    leader_name = EXCLUDED.leader_name,
    leader_roll = EXCLUDED.leader_roll,
    leader_email = EXCLUDED.leader_email,
    leader_phone = EXCLUDED.leader_phone,
    leader_college = EXCLUDED.leader_college,
    max_team_size = EXCLUDED.max_team_size,
    min_team_size = EXCLUDED.min_team_size,
    updated_at = now()
  RETURNING * INTO v_team;

  RETURN jsonb_build_object('success', true, 'team', to_jsonb(v_team));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Join Team by Code
CREATE OR REPLACE FUNCTION public.join_team_by_code(
  p_code TEXT,
  p_member JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_norm TEXT;
  v_team RECORD;
  v_members JSONB;
BEGIN
  v_norm := UPPER(REGEXP_REPLACE(p_code, '[^A-Za-z0-9]', '', 'g'));

  SELECT * INTO v_team
  FROM public.teams
  WHERE UPPER(REGEXP_REPLACE(team_code, '[^A-Za-z0-9]', '', 'g')) = v_norm
  FOR UPDATE;

  IF v_team IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team not found');
  END IF;

  IF 1 + jsonb_array_length(v_team.members) >= v_team.max_team_size THEN
    RETURN jsonb_build_object('success', false, 'error', 'Team is already at full capacity');
  END IF;

  v_members := v_team.members || jsonb_build_array(p_member);

  UPDATE public.teams
  SET members = v_members, updated_at = now()
  WHERE id = v_team.id;

  RETURN jsonb_build_object('success', true, 'members', v_members);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
