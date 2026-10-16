-- ============================================================
-- FESTRONIX 2026 - COMPLETE ALL-IN-ONE SUPABASE SETUP
-- Run this entire script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- PART 1: TABLES, CONSTRAINTS & STORED FUNCTIONS
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


-- PART 2: ROW-LEVEL SECURITY POLICIES
-- ============================================================
-- FESTRONIX ROW-LEVEL SECURITY (RLS) POLICIES
-- Run AFTER schema.sql in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (needed for teammate lookup, etc.)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Profile insert handled by trigger (SECURITY DEFINER), so no direct insert policy needed
CREATE POLICY "Profiles are created via trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- DEPARTMENTS
-- ============================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Departments are publicly readable"
  ON public.departments FOR SELECT
  USING (true);

-- Only global admins can modify departments
CREATE POLICY "Global admins can manage departments"
  ON public.departments FOR ALL
  USING (public.is_global_admin(auth.uid()));

-- ============================================================
-- EVENTS
-- ============================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Events are publicly readable"
  ON public.events FOR SELECT
  USING (true);

-- Admins and coordinators can insert events
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- Coordinators can update their department's events; global admins can update any
CREATE POLICY "Coordinators and admins can update events"
  ON public.events FOR UPDATE
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'dept_coordinator'
      AND ar.department_code = events.department_code
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role = 'event_coordinator'
      AND ar.event_id = events.id
    )
  );

-- Only global admins can delete events
CREATE POLICY "Global admins can delete events"
  ON public.events FOR DELETE
  USING (public.is_global_admin(auth.uid()));

-- ============================================================
-- REGISTRATIONS
-- ============================================================
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Participants see own registrations; admins/coordinators see scoped
CREATE POLICY "Users see own registrations, admins see scoped"
  ON public.registrations FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_global_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar
      JOIN public.events e ON e.id = registrations.event_id
      WHERE ar.user_id = auth.uid()
      AND (
        (ar.role = 'dept_coordinator' AND ar.department_code = e.department_code)
        OR (ar.role = 'event_coordinator' AND ar.event_id = registrations.event_id)
        OR ar.role = 'finance_reviewer'
        OR ar.role = 'checkin_staff'
      )
    )
  );

-- Authenticated users can create registrations
CREATE POLICY "Authenticated users can register"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update registrations (payment status, etc.)
CREATE POLICY "Admins can update registrations"
  ON public.registrations FOR UPDATE
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar
      JOIN public.events e ON e.id = registrations.event_id
      WHERE ar.user_id = auth.uid()
      AND (
        (ar.role = 'dept_coordinator' AND ar.department_code = e.department_code)
        OR (ar.role = 'event_coordinator' AND ar.event_id = registrations.event_id)
        OR ar.role = 'finance_reviewer'
      )
    )
  );

-- ============================================================
-- REGISTRATION MEMBERS
-- ============================================================
ALTER TABLE public.registration_members ENABLE ROW LEVEL SECURITY;

-- Visible to registration owner and admins
CREATE POLICY "Registration members visible to owner and admins"
  ON public.registration_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r 
      WHERE r.id = registration_members.registration_id 
      AND (r.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Insert when creating registration
CREATE POLICY "Members can be added during registration"
  ON public.registration_members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- TICKETS
-- ============================================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Visible to registration owner and admins
CREATE POLICY "Tickets visible to owner and admins"
  ON public.tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r 
      WHERE r.id = tickets.registration_id 
      AND (r.user_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Insert during registration
CREATE POLICY "Tickets created during registration"
  ON public.tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update for check-in (admins/staff only)
CREATE POLICY "Staff can update tickets for check-in"
  ON public.tickets FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- PAYMENT PROOFS
-- ============================================================
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

-- Only registration owner and authorized reviewers
CREATE POLICY "Payment proofs visible to owner and reviewers"
  ON public.payment_proofs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.registrations r 
      WHERE r.id = payment_proofs.registration_id 
      AND (
        r.user_id = auth.uid() 
        OR public.is_global_admin(auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.admin_roles ar
          JOIN public.events e ON e.id = r.event_id
          WHERE ar.user_id = auth.uid()
          AND (
            ar.role = 'finance_reviewer'
            OR (ar.role = 'dept_coordinator' AND ar.department_code = e.department_code)
            OR (ar.role = 'event_coordinator' AND ar.event_id = r.event_id)
          )
        )
      )
    )
  );

-- Participants can submit proof
CREATE POLICY "Participants can submit payment proof"
  ON public.payment_proofs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Reviewers can update proof status
CREATE POLICY "Reviewers can update payment proof"
  ON public.payment_proofs FOR UPDATE
  USING (
    public.is_global_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_roles ar 
      WHERE ar.user_id = auth.uid() 
      AND ar.role IN ('finance_reviewer', 'dept_coordinator', 'event_coordinator')
    )
  );

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Announcements are publicly readable"
  ON public.announcements FOR SELECT
  USING (true);

-- Admins can create/update/delete
CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ============================================================
-- CERTIFICATES
-- ============================================================
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Certificates visible to recipient and admins"
  ON public.certificates FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can manage certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));

-- ============================================================
-- SPONSORS
-- ============================================================
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sponsors are publicly readable"
  ON public.sponsors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sponsors"
  ON public.sponsors FOR ALL
  USING (public.is_global_admin(auth.uid()));

-- ============================================================
-- ADMIN ROLES
-- ============================================================
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Users can see their own roles; global admins see all
CREATE POLICY "Users see own roles, global admins see all"
  ON public.admin_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.is_global_admin(auth.uid())
  );

-- Only global admins can assign roles
CREATE POLICY "Global admins can manage roles"
  ON public.admin_roles FOR INSERT
  WITH CHECK (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can update roles"
  ON public.admin_roles FOR UPDATE
  USING (public.is_global_admin(auth.uid()));

CREATE POLICY "Global admins can remove roles"
  ON public.admin_roles FOR DELETE
  USING (public.is_global_admin(auth.uid()));

-- ============================================================
-- AUDIT LOGS (append-only for all authenticated users)
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

-- All authenticated users can insert (needed for logging actions)
CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- No update or delete on audit logs (immutable)


-- PART 3: INITIAL SEED DATA (DEPARTMENTS, EVENTS, ANNOUNCEMENTS)
-- ============================================================
-- FESTRONIX SEED DATA
-- Run AFTER schema.sql and rls_policies.sql
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO public.departments (id, code, name, description, chief_coordinator, contact, icon_name) VALUES
  (uuid_generate_v4(), 'CSE', 'Computer Science & Engineering', 'Flagship AI, algorithmic coding, cybersecurity, and full-stack software innovation.', 'Dr. K. S. Reddy', 'cse.festronix@vardhaman.org', 'Cpu'),
  (uuid_generate_v4(), 'IT', 'Information Technology', 'Cloud systems, web3 networks, distributed computing, and generative tech.', 'Prof. Anitha Sharma', 'it.festronix@vardhaman.org', 'Globe'),
  (uuid_generate_v4(), 'ECE', 'Electronics & Communication', 'Robotics, IoT circuits, signal processing, embedded architectures, and antenna design.', 'Dr. M. V. Ramana', 'ece.festronix@vardhaman.org', 'Radio'),
  (uuid_generate_v4(), 'EEE', 'Electrical & Electronics', 'Electric mobility, green energy grids, power systems, and automation logic.', 'Dr. B. Srinivas', 'eee.festronix@vardhaman.org', 'Zap'),
  (uuid_generate_v4(), 'MECH', 'Mechanical Engineering', 'CAD/CAM design, drone dynamics, RC racing, and 3D additive manufacturing.', 'Dr. C. H. Rao', 'mech.festronix@vardhaman.org', 'Wrench'),
  (uuid_generate_v4(), 'CIVIL', 'Civil Engineering', 'Smart city modeling, seismic structural design, and bridge load-testing.', 'Prof. P. Sunitha', 'civil.festronix@vardhaman.org', 'Building'),
  (uuid_generate_v4(), 'AI&ML', 'Artificial Intelligence & Machine Learning', 'Deep neural networks, computer vision, robotics RL, and LLM autonomous agents.', 'Dr. V. Prasad', 'aiml.festronix@vardhaman.org', 'Brain'),
  (uuid_generate_v4(), 'MBA', 'Management & Humanities', 'Venture pitch deck, corporate crisis simulations, and fintech trading floors.', 'Prof. R. L. Narayana', 'mba.festronix@vardhaman.org', 'Briefcase')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- EVENTS
-- ============================================================
INSERT INTO public.events (slug, title, department_code, category, format, min_team_size, max_team_size, fee, capacity, registered_count, deadline, date_display, time_display, venue, description, rules, prizes, eligibility, coordinator_name, coordinator_phone, coordinator_email, status, banner_gradient) VALUES
(
  'hack-the-future-24h',
  'CodeSphere: 24-Hour National Hackathon',
  'CSE', 'hackathon', 'team', 2, 4, 300, 60, 0,
  '2026-10-24 23:59:00+05:30',
  'Oct 28-29, 2026', '10:00 AM - 10:00 AM (24 Hours)',
  'CSE Turing Innovation Center, VCE Campus',
  'The premier national 24-hour hackathon where top minds architect AI, Web3, or Cyber-physical prototypes under high octane mentorship.',
  '["Team size: 2 to 4 members from any AICTE-recognized institution.", "All code must be written within the hackathon window; existing projects are disqualified.", "APIs, open-source libraries, and AI co-pilots are allowed with transparent declaration.", "Evaluation criteria: Innovation (30%), Technical Execution (30%), UI/UX (20%), Pitch (20%)."]'::jsonb,
  '{"first": "₹50,000 + Tech Incubation Grant", "second": "₹25,000 + Vouchers", "third": "₹10,000"}'::jsonb,
  'Open to all B.Tech / M.Tech / MCA / Degree students with valid college ID.',
  'Rohit Kulkarni', '+91 98480 11223', 'rohit.k@vardhaman.org',
  'open', 'linear-gradient(135deg, #00f0ff 0%, #7928ca 100%)'
),
(
  'robo-wars-colosseum',
  'RoboWars: Steel Gladiators Combat',
  'ECE', 'technical', 'team', 2, 5, 400, 32, 0,
  '2026-10-25 18:00:00+05:30',
  'Oct 28, 2026', '11:30 AM - 04:30 PM',
  'Central Open Air Theatre (OAT) Arena',
  'Remote-controlled combat battlebots face off in a reinforced bulletproof steel arena with fire hazards, flippers, and spinners.',
  '["Bot weight class: 15kg and 30kg categories.", "Active weapons mandatory (spinners, lifters, pneumatic hammers). No EMP or chemical fluids.", "Match duration: 3 minutes rounds. Knockout or judge score calculation.", "All bots must have remote radio fail-safe switches."]'::jsonb,
  '{"first": "₹40,000 + Trophy", "second": "₹20,000", "third": "₹8,000"}'::jsonb,
  'Engineering undergraduates and polytechnic innovators.',
  'Sanjay Varma', '+91 98765 43210', 'sanjay.v@vardhaman.org',
  'open', 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)'
),
(
  'ai-prompt-engineering-showdown',
  'PromptMatrix: Autonomous AI Agents & Vision',
  'AI&ML', 'technical', 'duo', 1, 2, 150, 80, 0,
  '2026-10-26 12:00:00+05:30',
  'Oct 29, 2026', '01:30 PM - 03:30 PM',
  'Aryabhata Computing Lab 4, Block 2',
  'Solve real-world multi-modal visual synthesis, complex logic extraction, and jailbreak defense challenges with cutting-edge LLMs and vision transformers.',
  '["Solo or Duo participation permitted.", "Participants will be provided sandboxed API keys and compute environments.", "Scoring based on output benchmark accuracy, token efficiency, and prompt latency."]'::jsonb,
  '{"first": "₹20,000 + AI Cloud Credits", "second": "₹10,000", "third": "₹5,000"}'::jsonb,
  'Open to all registered tech students.',
  'Divya Sri', '+91 94401 23456', 'divyasri.aiml@vardhaman.org',
  'open', 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
),
(
  'valorant-championship-festronix',
  'Apex Arena: Valorant 5v5 Tactical Championship',
  'IT', 'gaming', 'team', 5, 5, 500, 24, 0,
  '2026-10-23 20:00:00+05:30',
  'Oct 28-29, 2026', '10:00 AM Onwards',
  'VCE E-Sports Arena, High Performance Lab',
  'High-stakes LAN esports tournament on 240Hz monitors with custom lobbies, live casters, and tournament streaming.',
  '["5 players per squad. Standard competitive tournament ruleset.", "Single elimination preliminary; Best-of-3 semifinals and Grand Finale.", "Anti-cheat and toxic conduct enforcement strictly active."]'::jsonb,
  '{"first": "₹30,000 + Pro Gaming Peripherals", "second": "₹15,000"}'::jsonb,
  'All students with valid college ID.',
  'Karthik Teja', '+91 90001 98877', 'karthik.t@vardhaman.org',
  'open', 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)'
),
(
  'ev-powertrain-masterclass',
  'EV Architecture & Battery BMS Hands-on Workshop',
  'EEE', 'workshop', 'individual', 1, 1, 200, 100, 0,
  '2026-10-27 10:00:00+05:30',
  'Oct 28, 2026', '09:30 AM - 01:00 PM',
  'Auditorium 1, Main Administrative Building',
  'Industrial masterclass on lithium-ion cell thermal management, regenerative braking systems, and micro-controller hardware programming.',
  '["Hands-on workshop kit provided to participants.", "Official industry certificate issued by IEEE and SAC."]'::jsonb,
  '{"first": "Certificate of Excellence + Hardware Dev Board"}'::jsonb,
  'All engineering disciplines.',
  'Ramesh Chander', '+91 91234 56789', 'ramesh.eee@vardhaman.org',
  'open', 'linear-gradient(135deg, #eab308 0%, #f97316 100%)'
),
(
  'bridge-craft-structural-challenge',
  'Bridge-Craft: Seismic Truss Loading Challenge',
  'CIVIL', 'technical', 'duo', 2, 3, 100, 40, 0,
  '2026-10-26 15:00:00+05:30',
  'Oct 29, 2026', '11:00 AM - 02:00 PM',
  'Strength of Materials Lab, Civil Block',
  'Design and fabricate lightweight balsa/pop-stick bridge structures tested to failure on computerized hydraulic loading rigs.',
  '["Materials provided by organizers on-spot.", "Evaluation based on Load-to-Self-Weight ratio."]'::jsonb,
  '{"first": "₹15,000 + Memento", "second": "₹8,000"}'::jsonb,
  'All students interested in structural mechanics.',
  'Pooja Reddy', '+91 99887 76655', 'pooja.civil@vardhaman.org',
  'open', 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
),
(
  'cad-gladiator-rc-chase',
  'AeroDrone: Autonomous FPV Obstacle Derby',
  'MECH', 'technical', 'team', 2, 3, 250, 25, 0,
  '2026-10-26 23:59:00+05:30',
  'Oct 28, 2026', '02:00 PM - 05:00 PM',
  'Main Sports Complex Cricket Ground',
  'Pilot custom quadcopters through illuminated neon rings, vertical slaloms, and smoke curtains against the clock.',
  '["FPV quadcopters max 5-inch prop diameter or standard 250mm frames.", "Lap timer transponders will be assigned during safety inspection."]'::jsonb,
  '{"first": "₹25,000 + Carbon Fiber Drone Frame Kit", "second": "₹12,000"}'::jsonb,
  'Open to drone hobbyists and students.',
  'Naveen Kumar', '+91 97001 22334', 'naveen.mech@vardhaman.org',
  'open', 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
),
(
  'shark-tank-vardhaman-venture',
  'VentureVortex: Shark Pitch & Angel Sim',
  'MBA', 'non-technical', 'team', 1, 3, 0, 50, 0,
  '2026-10-27 18:00:00+05:30',
  'Oct 29, 2026', '10:00 AM - 01:30 PM',
  'VCE Innovation Cell Boardroom',
  'Pitch disruptive technological startups to real angel investors and venture capitalists. Free registration with seed incubation opportunities.',
  '["5-minute pitch deck followed by 3-minute jury cross-examination.", "Financial projections and MVP prototype demo carry bonus points."]'::jsonb,
  '{"first": "₹35,000 Seed Grant + Incubation", "second": "₹15,000"}'::jsonb,
  'Open to all aspiring student founders.',
  'Aishwarya Rao', '+91 94901 99880', 'aishwarya.mba@vardhaman.org',
  'open', 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
INSERT INTO public.announcements (title, message, type, scope) VALUES
  ('⚡ CodeSphere Hackathon Problem Statements Unveiled!', 'National hackathon track themes in Healthcare AI, CleanTech, and Autonomous Logistics are now published on the portal.', 'urgent', 'fest-wide'),
  ('🏆 Cash Prize Pool Enhanced to ₹5,00,000!', 'SAC Vardhaman has officially increased prize distributions across all 8 engineering departments.', 'prize', 'fest-wide'),
  ('🚌 Free College Transit Shuttles on Fest Days', 'Special VCE AC buses will operate from Shamshabad, Mehdipatnam, LB Nagar, and Secunderabad for external participants.', 'general', 'fest-wide')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STORAGE BUCKETS (run in Supabase dashboard → Storage)
-- Or use SQL:
-- ============================================================
-- Note: Storage bucket creation via SQL may need to be done manually
-- in the Supabase Dashboard → Storage → Create new bucket:
--   1. "payment-screenshots" — Private bucket
--   2. "certificates" — Private bucket
