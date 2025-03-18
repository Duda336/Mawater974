-- This migration updates the handle_new_user function to include country_id

-- Update the handle_new_user function to include country_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  raw_user_meta JSONB;
  full_name TEXT;
  country_id INTEGER;
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

  -- Insert profile with extracted data
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    role,
    country_id
  )
  VALUES (
    NEW.id,
    NEW.email,
    full_name,
    'normal_user',
    country_id
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    country_id = COALESCE(EXCLUDED.country_id, profiles.country_id),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE NOTICE 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
