-- ==============================================================================
-- FESTRONIX 2026: SQUAD TEAMS & REGISTRATION PERMISSIONS FIX
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Create teams table if not exists
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY DEFAULT ('TEAM-' || floor(random() * 9000 + 1000)::text),
  team_code TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  registration_id TEXT DEFAULT '',
  leader_id TEXT,
  leader_name TEXT NOT NULL,
  leader_roll TEXT,
  leader_email TEXT,
  leader_phone TEXT,
  leader_college TEXT,
  members JSONB DEFAULT '[]'::jsonb,
  max_team_size INT DEFAULT 4,
  min_team_size INT DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for fast code lookups
CREATE INDEX IF NOT EXISTS idx_teams_code ON public.teams (upper(regexp_replace(team_code, '[^A-Za-z0-9]', '', 'g')));
CREATE INDEX IF NOT EXISTS idx_teams_event ON public.teams (event_id);

-- 3. Row-Level Security for Teams (Public read, insert, and update)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teams are publicly readable" ON public.teams;
CREATE POLICY "Teams are publicly readable" 
  ON public.teams FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Teams are publicly insertable" ON public.teams;
CREATE POLICY "Teams are publicly insertable" 
  ON public.teams FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Teams are publicly updatable" ON public.teams;
CREATE POLICY "Teams are publicly updatable" 
  ON public.teams FOR UPDATE 
  USING (true);

-- 4. Ensure registrations table has team columns and public permissions
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_code TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS team_name TEXT;

-- Enable public registration insert and select so attendees without Supabase auth sessions can register
DROP POLICY IF EXISTS "Public can create registrations" ON public.registrations;
CREATE POLICY "Public can create registrations" 
  ON public.registrations FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view own registrations" ON public.registrations;
CREATE POLICY "Public can view own registrations" 
  ON public.registrations FOR SELECT 
  USING (true);

-- 5. RPC: find_team_by_code
CREATE OR REPLACE FUNCTION public.find_team_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_norm TEXT;
  v_team RECORD;
BEGIN
  v_norm := upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g'));
  
  SELECT * INTO v_team FROM public.teams 
  WHERE upper(regexp_replace(team_code, '[^A-Za-z0-9]', '', 'g')) = v_norm
  LIMIT 1;
  
  IF FOUND THEN
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
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Team not found');
  END IF;
END;
$$;

-- 6. RPC: create_or_reserve_team
CREATE OR REPLACE FUNCTION public.create_or_reserve_team(
  p_team_code TEXT,
  p_team_name TEXT,
  p_event_id TEXT,
  p_event_title TEXT,
  p_leader_name TEXT,
  p_leader_roll TEXT DEFAULT '',
  p_leader_email TEXT DEFAULT '',
  p_leader_phone TEXT DEFAULT '',
  p_leader_college TEXT DEFAULT '',
  p_leader_id TEXT DEFAULT NULL,
  p_max_team_size INT DEFAULT 4,
  p_min_team_size INT DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_team RECORD;
BEGIN
  INSERT INTO public.teams (
    team_code, team_name, event_id, event_title,
    leader_name, leader_roll, leader_email, leader_phone, leader_college,
    leader_id, max_team_size, min_team_size
  ) VALUES (
    p_team_code, p_team_name, p_event_id, p_event_title,
    p_leader_name, p_leader_roll, p_leader_email, p_leader_phone, p_leader_college,
    p_leader_id, p_max_team_size, p_min_team_size
  )
  ON CONFLICT (team_code) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    leader_name = EXCLUDED.leader_name,
    leader_roll = EXCLUDED.leader_roll,
    leader_email = EXCLUDED.leader_email,
    leader_phone = EXCLUDED.leader_phone,
    leader_college = EXCLUDED.leader_college,
    event_id = EXCLUDED.event_id,
    event_title = EXCLUDED.event_title
  RETURNING * INTO v_team;

  RETURN jsonb_build_object('success', true, 'team', row_to_json(v_team));
END;
$$;

-- 7. HOW TO ENABLE EMAIL LOGINS IN SUPABASE DASHBOARD (OPTIONAL / RECOMMENDED):
-- If you want native Supabase Auth JWT sessions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/fbvztmttixmmqorvqtbb/auth/providers
-- 2. Click on "Email" under Auth Providers.
-- 3. Toggle "Enable Email provider" to ON.
-- 4. Toggle "Confirm email" to OFF (unless you have custom SMTP configured).
-- 5. Click Save.
-- (Note: Festronix client has seamless failover and verified profile authentication built-in,
-- so delegates can log in immediately with their Roll Number and password regardless).

-- 8. RPC: register_or_update_profile
-- Allows saving student profiles even if Supabase Email Auth provider is turned off
CREATE OR REPLACE FUNCTION public.register_or_update_profile(
  p_id UUID,
  p_roll_number TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT '',
  p_college TEXT DEFAULT 'Vardhaman College of Engineering',
  p_username TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  INSERT INTO public.profiles (
    id, roll_number, full_name, email, phone, college, username, updated_at
  ) VALUES (
    p_id, p_roll_number, p_full_name, p_email, p_phone, p_college, p_username, now()
  )
  ON CONFLICT (id) DO UPDATE SET
    roll_number = EXCLUDED.roll_number,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    college = EXCLUDED.college,
    username = EXCLUDED.username,
    updated_at = now()
  RETURNING * INTO v_profile;

  RETURN jsonb_build_object('success', true, 'profile', row_to_json(v_profile));
END;
$$;
