-- This migration fixes issues with user signup and profile creation

-- Add 'dealer' to the user_role enum type if it doesn't exist
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'dealer';

-- Remove city_id column from profiles table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'profiles' 
        AND ccu.column_name = 'city_id'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'profiles' 
            AND ccu.column_name = 'city_id'
            LIMIT 1
        );
    END IF;
END
$$;

ALTER TABLE profiles DROP COLUMN IF EXISTS city_id;

-- 1. Update the handle_new_user function to include country_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_user_meta JSONB;
  full_name TEXT;
  country_id INTEGER;
  phone_number TEXT;
  password_plain TEXT;
BEGIN
  -- Extract metadata if available
  raw_user_meta := (NEW.raw_user_meta_data::jsonb);
  full_name := COALESCE(
    raw_user_meta->>'full_name',
    raw_user_meta->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Try to extract country_id from metadata
  BEGIN
    country_id := (raw_user_meta->>'country_id')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    -- Default to null if not present or invalid
    country_id := NULL;
  END;

  -- Try to extract phone_number from metadata
  BEGIN
    phone_number := raw_user_meta->>'phone_number';
  EXCEPTION WHEN OTHERS THEN
    -- Default to null if not present or invalid
    phone_number := NULL;
  END;

  -- Try to extract password_plain from metadata
  BEGIN
    password_plain := raw_user_meta->>'password_plain';
  EXCEPTION WHEN OTHERS THEN
    -- Default to null if not present or invalid
    password_plain := NULL;
  END;

  -- Insert profile with extracted data
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    role,
    country_id,
    phone_number,
    password_plain
  )
  VALUES (
    NEW.id,
    NEW.email,
    full_name,
    'normal_user',
    country_id,
    phone_number,
    password_plain
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    country_id = COALESCE(EXCLUDED.country_id, profiles.country_id),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    password_plain = COALESCE(EXCLUDED.password_plain, profiles.password_plain),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a function to ensure a user profile exists
CREATE OR REPLACE FUNCTION public.ensure_user_profile_exists(
  user_id UUID
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  user_email TEXT;
  user_full_name TEXT;
BEGIN
  -- Get user info from auth.users
  SELECT email, raw_user_meta_data->>'full_name'
  INTO user_email, user_full_name
  FROM auth.users
  WHERE id = user_id;
  
  IF user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;
  
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Create profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role
    ) VALUES (
      user_id,
      user_email,
      COALESCE(user_full_name, split_part(user_email, '@', 1)),
      'normal_user'
    );
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Profile created successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', true,
      'message', 'Profile already exists'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error ensuring profile exists: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update the update_user_profile function to handle both creation and updates
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_phone TEXT,
  user_password TEXT DEFAULT NULL,
  user_country_id INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- First ensure the profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
    -- Create the profile
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      phone_number,
      password_plain,
      country_id,
      role
    ) VALUES (
      user_id,
      user_email,
      user_full_name,
      user_phone,
      user_password,
      user_country_id,
      'normal_user'
    );
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Profile created successfully'
    );
  ELSE
    -- Update existing profile
    UPDATE public.profiles
    SET
      email = COALESCE(user_email, email),
      full_name = COALESCE(user_full_name, full_name),
      phone_number = COALESCE(user_phone, phone_number),
      password_plain = COALESCE(user_password, password_plain),
      country_id = COALESCE(user_country_id, country_id),
      updated_at = NOW()
    WHERE id = user_id;
    
    result := jsonb_build_object(
      'success', true,
      'message', 'Profile updated successfully'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error updating profile: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Fix any existing users without profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data->>'full_name' as full_name
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role
    ) VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.full_name, split_part(user_record.email, '@', 1)),
      'normal_user'
    );
  END LOOP;
END;
$$;
