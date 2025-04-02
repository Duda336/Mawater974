-- Quick diagnostic queries to run in Supabase SQL Editor to diagnose auth issues

-- Note: On hosted Supabase, direct access to auth schema may be restricted

-- Check profiles table status (this should always work)
SELECT EXISTS(
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles'
) AS profiles_exists;

-- Check column names in profiles
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles';

-- These queries may not work on hosted Supabase:

-- Try to check if the trigger exists (may fail in hosted Supabase)
DO $$
BEGIN
  PERFORM COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  RAISE NOTICE 'Successfully checked triggers';
EXCEPTION WHEN OTHERS THEN 
  RAISE NOTICE 'Cannot check triggers - this is normal in hosted Supabase';
END
$$;

-- Run our diagnostic functions (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_auth_setup') THEN
    RAISE NOTICE 'Running verify_auth_setup()';
  ELSE
    RAISE NOTICE 'verify_auth_setup() function does not exist';
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'diagnose_auth_issues') THEN
    RAISE NOTICE 'Running diagnose_auth_issues()';
  ELSE
    RAISE NOTICE 'diagnose_auth_issues() function does not exist';
  END IF;
END
$$;

-- Only run these if the functions exist
SELECT * FROM public.verify_auth_setup() WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'verify_auth_setup');
SELECT * FROM public.diagnose_auth_issues() WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'diagnose_auth_issues');

-- Fix any missing columns (safe to run)
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    RAISE NOTICE 'Added full_name column';
  END IF;
  
  -- Add phone_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
    RAISE NOTICE 'Added phone_number column';
  END IF;
  
  -- Add password_plain column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'password_plain'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_plain TEXT;
    RAISE NOTICE 'Added password_plain column';
  END IF;
END
$$;
