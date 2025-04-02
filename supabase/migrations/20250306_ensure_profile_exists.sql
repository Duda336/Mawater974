-- This migration adds a function to ensure a user profile exists

-- Create a function to ensure a user profile exists
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
