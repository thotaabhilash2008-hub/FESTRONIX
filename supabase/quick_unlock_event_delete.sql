-- ==============================================================================
-- FESTRONIX 2026: QUICK UNLOCK FOR EVENT DELETION IN SUPABASE
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. Ensure foreign keys cascade so deleting an event never violates constraints
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS announcements_event_id_fkey;
ALTER TABLE public.announcements 
  ADD CONSTRAINT announcements_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS certificates_event_id_fkey;
ALTER TABLE public.certificates 
  ADD CONSTRAINT certificates_event_id_fkey 
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- 2. Drop any restrictive delete policies and allow event deletion
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Global admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Allow event deletion" ON public.events;
CREATE POLICY "Allow event deletion" ON public.events FOR DELETE USING (true);

-- 3. Verify RLS policy is active
SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'events';
