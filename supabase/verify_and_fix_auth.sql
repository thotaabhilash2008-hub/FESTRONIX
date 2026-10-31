-- ============================================================
-- FESTRONIX: Verify & Fix Auth Setup
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Check if the required triggers exist
SELECT 
  tgname AS trigger_name, 
  tgrelid::regclass AS table_name, 
  CASE tgenabled 
    WHEN 'O' THEN 'ENABLED' 
    WHEN 'D' THEN 'DISABLED' 
    ELSE tgenabled::text 
  END AS status
FROM pg_trigger 
WHERE tgname IN ('on_auth_user_created', 'tr_auto_confirm_new_user');

-- 2. Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check how many auth users exist vs profiles
SELECT 
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) AS profiles_count;

-- 4. Show auth users missing profiles (if any)
SELECT u.id, u.email, u.created_at, u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 5. Auto-confirm all existing users (in case some are unconfirmed)
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email_confirmed_at IS NULL;

-- 6. Recreate the auto-confirm trigger (ensures it exists)
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

-- 7. Recreate the profile-creation trigger (ensures it exists)
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

-- 8. Backfill profiles for any auth users that are missing one
INSERT INTO public.profiles (id, full_name, email, phone, college, roll_number, username)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  COALESCE(u.raw_user_meta_data->>'college', 'Vardhaman College of Engineering'),
  COALESCE(u.raw_user_meta_data->>'roll_number', ''),
  COALESCE(u.raw_user_meta_data->>'username', LOWER(COALESCE(u.raw_user_meta_data->>'roll_number', SPLIT_PART(u.email, '@', 1))))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Done! Check the output of queries 1-4 above to verify everything is correct.
