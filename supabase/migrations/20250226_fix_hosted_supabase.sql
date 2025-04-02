-- Safe migration for hosted Supabase that won't try to access restricted tables
-- This script only focuses on what we can actually control in the public schema

-- First check and create the profiles table if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
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

  -- Add phone_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone_number TEXT;
  END IF;

  -- Add password_plain column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'password_plain'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN password_plain TEXT;
  END IF;

  -- Make sure we have role column
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
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

-- Create a diagnostic function
CREATE OR REPLACE FUNCTION public.check_profiles_setup()
RETURNS TEXT AS $$
DECLARE
  profile_count INTEGER;
  columns_info TEXT;
BEGIN
  -- Get profile count
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  
  -- Get column information
  SELECT string_agg(column_name || ' (' || data_type || ')', ', ')
  INTO columns_info
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'profiles';
  
  RETURN 'Profiles table exists with ' || profile_count || ' records. Columns: ' || columns_info;
END;
$$ LANGUAGE plpgsql;
