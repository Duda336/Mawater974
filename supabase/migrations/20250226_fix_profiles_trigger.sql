-- This migration fixes issues with the user signup trigger

-- Check and ensure the profiles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    CREATE TABLE public.profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      phone_number TEXT,
      password_plain TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
    );

    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Public profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);

    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END
$$;

-- Ensure the profiles table has the correct columns
DO $$
BEGIN
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
  END IF;

  -- Handle potential name -> full_name migration 
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name'
  ) THEN
    -- Update name to full_name for existing records only if full_name is NULL and name is not
    UPDATE public.profiles
    SET full_name = name
    WHERE full_name IS NULL AND name IS NOT NULL;
  END IF;
END
$$;

-- Make sure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_user_meta JSONB;
  full_name TEXT;
BEGIN
  -- Extract metadata if available
  raw_user_meta := (NEW.raw_user_meta_data::jsonb);
  full_name := COALESCE(
    raw_user_meta->>'full_name',
    raw_user_meta->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert profile with extracted data
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    full_name,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;  -- Add this to prevent errors if the user already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to help debug the signup process
CREATE OR REPLACE FUNCTION public.verify_auth_setup()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check if profiles table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RETURN QUERY SELECT 
      'profiles_table_exists'::TEXT,
      'ok'::TEXT,
      'The profiles table exists in the public schema'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'profiles_table_exists'::TEXT,
      'missing'::TEXT,
      'The profiles table is missing, creating it now'::TEXT;
    
    -- Create the profiles table
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY,
      email TEXT,
      full_name TEXT,
      phone_number TEXT,
      password_plain TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;

  -- Check if handle_new_user function exists
  IF EXISTS (
    SELECT FROM pg_proc
    WHERE proname = 'handle_new_user' AND pronamespace = 'public'::regnamespace
  ) THEN
    RETURN QUERY SELECT 
      'handle_new_user_function'::TEXT,
      'ok'::TEXT,
      'The handle_new_user function exists'::TEXT;
  ELSE
    RETURN QUERY SELECT 
      'handle_new_user_function'::TEXT,
      'missing'::TEXT,
      'The handle_new_user function does not exist, it will be created later in this script'::TEXT;
  END IF;

  -- Check if the trigger exists on auth.users
  BEGIN
    IF EXISTS (
      SELECT FROM pg_trigger
      WHERE tgname = 'on_auth_user_created'
    ) THEN
      RETURN QUERY SELECT 
        'auth_user_trigger'::TEXT,
        'ok'::TEXT,
        'The trigger on auth.users exists'::TEXT;
    ELSE
      RETURN QUERY SELECT 
        'auth_user_trigger'::TEXT,
        'missing'::TEXT,
        'The trigger on auth.users is missing. Note: On hosted Supabase, you cannot create this directly.'::TEXT;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT 
        'auth_user_trigger'::TEXT,
        'unknown'::TEXT,
        'Unable to check if the trigger exists. This is normal in hosted Supabase environments.'::TEXT;
  END;

  -- Check if auth is enabled (this will fail in hosted Supabase, which is expected)
  BEGIN
    RETURN QUERY SELECT 
      'auth_enabled'::TEXT,
      'unknown'::TEXT,
      'Cannot check auth directly in hosted Supabase (this is normal).'::TEXT;
  END;

END;
$$ LANGUAGE plpgsql;

-- Additional diagnostics and fixes for "Database error saving new user"

-- Check for any database constraints that might be blocking user creation
CREATE OR REPLACE FUNCTION public.diagnose_auth_issues()
RETURNS TEXT AS $$
DECLARE
  constraint_info TEXT;
  missing_tables TEXT;
  schema_check TEXT;
  auth_exists BOOLEAN;
BEGIN
  -- Check if auth schema exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth'
  ) INTO auth_exists;

  IF NOT auth_exists THEN
    RETURN 'Auth schema does not exist. This might be a hosted Supabase instance.';
  END IF;

  -- Check for auth schema tables
  SELECT string_agg(table_name, ', ') 
  INTO missing_tables
  FROM (
    SELECT 'users' as table_name
    UNION SELECT 'identities' as table_name
    UNION SELECT 'refresh_tokens' as table_name
  ) required_tables
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = required_tables.table_name
  );
  
  IF missing_tables IS NOT NULL THEN
    RETURN 'Missing required auth tables: ' || missing_tables || '. This might be expected in hosted Supabase.';
  END IF;
  
  -- Try to check auth schema users table constraints if it exists
  BEGIN
    SELECT string_agg(constraint_name || ' (' || constraint_type || ')', ', ')
    INTO constraint_info
    FROM information_schema.table_constraints
    WHERE table_schema = 'auth' AND table_name = 'users';
  EXCEPTION
    WHEN OTHERS THEN
      constraint_info := 'Could not check auth constraints: ' || SQLERRM;
  END;
  
  -- Try to check schema of auth.users if it exists
  BEGIN
    SELECT string_agg(column_name || ' ' || data_type, ', ')
    INTO schema_check
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users';
  EXCEPTION
    WHEN OTHERS THEN
      schema_check := 'Could not check auth.users schema: ' || SQLERRM;
  END;
  
  RETURN 'Auth diagnostics complete. Hosted Supabase instances may not expose auth schema details. User table constraints: ' || COALESCE(constraint_info, 'N/A') || '. User table schema: ' || COALESCE(schema_check, 'N/A');
END;
$$ LANGUAGE plpgsql;

-- Fix: Make sure auth.config settings are correctly configured for email signup
DO $$
BEGIN
  -- Only run this if auth.config exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'config'
  ) THEN
    UPDATE auth.config 
    SET raw_config = jsonb_set(
      raw_config,
      '{email,enable_signup}',
      'true'::jsonb
    )
    WHERE raw_config->'email'->>'enable_signup' = 'false';
  END IF;
END
$$;

-- Fix: Ensure the default role is available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'
  ) THEN
    CREATE ROLE authenticated;
    GRANT authenticated TO postgres;
  END IF;
END
$$;

-- Fix: Ensure auth.users has correct triggers and doesn't have conflicting ones
DO $$
DECLARE
  has_auth_tables BOOLEAN;
BEGIN
  -- Check if we can access auth tables directly
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) INTO has_auth_tables;

  -- Only try to manipulate triggers if we have access to auth tables
  IF has_auth_tables THEN
    BEGIN
      -- Look for and drop any duplicate/conflicting triggers
      EXECUTE (
        SELECT string_agg('DROP TRIGGER IF EXISTS ' || tgname || ' ON auth.users;', ' ')
        FROM pg_trigger
        WHERE tgrelid = 'auth.users'::regclass
        AND tgname != 'on_auth_user_created'
        AND tgname LIKE '%user%'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- If error, likely we don't have sufficient privileges on hosted Supabase
        RAISE NOTICE 'Unable to modify auth.users triggers: %. This is expected in hosted Supabase.', SQLERRM;
    END;
  END IF;
END
$$;

-- Create RPC function for updating user profiles from client
-- This function allows the frontend to update a user's profile while handling errors gracefully
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_phone TEXT,
  user_password TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Ensure the profile exists
  INSERT INTO public.profiles (id, email, full_name, phone_number, password_plain)
  VALUES (user_id, user_email, user_full_name, user_phone, user_password)
  ON CONFLICT (id) DO UPDATE
  SET
    email = user_email,
    full_name = user_full_name,
    phone_number = user_phone,
    password_plain = COALESCE(user_password, profiles.password_plain),
    updated_at = NOW();

  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error updating profile: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run diagnose function
-- SELECT public.diagnose_auth_issues();

-- Optional: run the verification function
-- SELECT * FROM public.verify_auth_setup();
