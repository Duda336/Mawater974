-- First drop the existing function if it exists
DROP FUNCTION IF EXISTS public.reject_dealership(bigint, uuid, text);

-- Create the reject_dealership function
CREATE OR REPLACE FUNCTION public.reject_dealership(
  dealership_id bigint,
  reviewer_id uuid,
  notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the dealership status
  UPDATE dealerships
  SET 
    status = 'rejected',
    reviewer_id = reject_dealership.reviewer_id,
    review_notes = reject_dealership.notes,
    reviewed_at = NOW()
  WHERE id = dealership_id;
  
  RETURN true;
END;
$$;
