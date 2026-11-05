-- ==============================================================================
-- FESTRONIX 2026: UNLOCK ALL PERMISSIONS & RLS FOR ADMIN & PUBLIC ACTIONS
-- Run this in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Grant table-level access to both anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- 2. EVENTS TABLE: Open RLS Policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events are publicly readable" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Coordinators and admins can update events" ON public.events;
DROP POLICY IF EXISTS "Global admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Allow event deletion" ON public.events;
DROP POLICY IF EXISTS "Allow public read on events" ON public.events;
DROP POLICY IF EXISTS "Allow update on events" ON public.events;
DROP POLICY IF EXISTS "Allow insert on events" ON public.events;
DROP POLICY IF EXISTS "Allow delete on events" ON public.events;

CREATE POLICY "Allow public read on events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow update on events" ON public.events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow insert on events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete on events" ON public.events FOR DELETE USING (true);

-- 3. ANNOUNCEMENTS TABLE: Open RLS Policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Announcements are publicly readable" ON public.announcements;
DROP POLICY IF EXISTS "Admins can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow read on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow insert on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow update on announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow delete on announcements" ON public.announcements;

CREATE POLICY "Allow read on announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow insert on announcements" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on announcements" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "Allow delete on announcements" ON public.announcements FOR DELETE USING (true);

-- 4. DEPARTMENTS TABLE: Open RLS Policies
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Departments are publicly readable" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Global admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Allow read on departments" ON public.departments;
DROP POLICY IF EXISTS "Allow insert on departments" ON public.departments;
DROP POLICY IF EXISTS "Allow update on departments" ON public.departments;
DROP POLICY IF EXISTS "Allow delete on departments" ON public.departments;

CREATE POLICY "Allow read on departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow insert on departments" ON public.departments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update on departments" ON public.departments FOR UPDATE USING (true);
CREATE POLICY "Allow delete on departments" ON public.departments FOR DELETE USING (true);

-- 5. REGISTRATIONS & TEAMS TABLE: Open RLS Policies for Admin & Portal operations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow update on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow insert on registrations" ON public.registrations;

CREATE POLICY "Allow read on registrations" ON public.registrations FOR SELECT USING (true);
CREATE POLICY "Allow update on registrations" ON public.registrations FOR UPDATE USING (true);
CREATE POLICY "Allow insert on registrations" ON public.registrations FOR INSERT WITH CHECK (true);

-- 6. TEAMS TABLE
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow update on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow insert on teams" ON public.teams;

CREATE POLICY "Allow read on teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow update on teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Allow insert on teams" ON public.teams FOR INSERT WITH CHECK (true);

-- 7. AUDIT LOGS TABLE
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read on audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow insert on audit_logs" ON public.audit_logs;

CREATE POLICY "Allow read on audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert on audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 8. Verification query
SELECT tablename, policyname, cmd, permissive FROM pg_policies WHERE schemaname = 'public';
