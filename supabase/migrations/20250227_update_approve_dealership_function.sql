-- Update the approve_dealership function to also set the user's role to 'dealer'
CREATE OR REPLACE FUNCTION public.approve_dealership(
  dealership_id bigint,
  reviewer_id uuid,
  notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dealership_user_id uuid;
BEGIN
  -- First, get the user_id from the dealership
  SELECT user_id INTO dealership_user_id
  FROM dealerships
  WHERE id = dealership_id;
  
  -- Update the dealership status
  UPDATE dealerships
  SET 
    status = 'approved',
    reviewer_id = approve_dealership.reviewer_id,
    review_notes = approve_dealership.notes,
    reviewed_at = NOW()
  WHERE id = dealership_id;
  
  -- Update the user's role to 'dealer' in the profiles table
  UPDATE profiles
  SET role = 'dealer'
  WHERE id = dealership_user_id;
  
  RETURN true;
END;
$$;
