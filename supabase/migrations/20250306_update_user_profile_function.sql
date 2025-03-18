-- Update the function to handle the profile update correctly, ensuring it creates the profile if it doesn't exist
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
