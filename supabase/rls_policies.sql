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

-- ============================================================
-- TEAMS (Squad & Invite System)
-- ============================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Anyone can search teams by code (needed for join flow)
CREATE POLICY "Anyone can view teams by code"
  ON public.teams FOR SELECT
  USING (true);

-- Authenticated users or RPCs can create or reserve teams
CREATE POLICY "Users can create or reserve teams"
  ON public.teams FOR INSERT
  WITH CHECK (true);

-- Leaders or members can update team information
CREATE POLICY "Team leader or members can update teams"
  ON public.teams FOR UPDATE
  USING (true);
