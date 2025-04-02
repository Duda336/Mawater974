-- Add currency_code field to cars table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'cars' 
    AND column_name = 'currency_code'
  ) THEN
    ALTER TABLE public.cars 
    ADD COLUMN currency_code VARCHAR(10);
  END IF;
END $$;

-- Create function to set currency_code based on country_id
CREATE OR REPLACE FUNCTION public.set_car_currency_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.currency_code IS NULL AND NEW.country_id IS NOT NULL THEN
    NEW.currency_code := (
      SELECT c.currency_code
      FROM public.countries c
      WHERE c.id = NEW.country_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set currency_code when inserting a new car
DROP TRIGGER IF EXISTS set_car_currency_code_trigger ON public.cars;

CREATE TRIGGER set_car_currency_code_trigger
BEFORE INSERT ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.set_car_currency_code();
