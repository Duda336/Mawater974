-- SQL script to modify the chk_valid_location constraint for multi-country support

-- First, drop the existing constraint
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS chk_valid_location;

-- Create a new function to validate location based on country_id
CREATE OR REPLACE FUNCTION validate_location_by_country()
RETURNS TRIGGER AS $$
DECLARE
  valid_location BOOLEAN;
BEGIN
  -- Check if the location exists in the cities table for the given country
  SELECT EXISTS (
    SELECT 1 
    FROM cities 
    WHERE country_id = NEW.country_id 
    AND name = NEW.location
  ) INTO valid_location;

  IF NOT valid_location THEN
    -- Get the country name for the error message
    DECLARE
      country_name TEXT;
    BEGIN
      SELECT name INTO country_name FROM countries WHERE id = NEW.country_id;
      RAISE EXCEPTION 'Invalid location for %', country_name;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to validate location before insert or update
DROP TRIGGER IF EXISTS validate_location_trigger ON public.cars;
CREATE TRIGGER validate_location_trigger
BEFORE INSERT OR UPDATE ON public.cars
FOR EACH ROW
EXECUTE FUNCTION validate_location_by_country();

-- Add a comment to explain the validation
COMMENT ON TRIGGER validate_location_trigger ON public.cars IS 'Validates that the location matches a city name in the cities table for the selected country';

-- Alternatively, if you prefer a simpler approach without triggers, you can use this constraint:
-- ALTER TABLE public.cars ADD CONSTRAINT chk_location_not_null CHECK (location IS NOT NULL);
