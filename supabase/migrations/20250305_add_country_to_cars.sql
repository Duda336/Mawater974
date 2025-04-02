-- Add country_id field to cars table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'cars' 
    AND column_name = 'country_id'
  ) THEN
    ALTER TABLE public.cars 
    ADD COLUMN country_id INTEGER REFERENCES public.countries(id);
  END IF;
END $$;

-- Create index for better performance if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE indexname = 'idx_cars_country_id'
  ) THEN
    CREATE INDEX idx_cars_country_id ON public.cars(country_id);
  END IF;
END $$;

-- Make sure RLS is enabled on the cars table
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for cars table to filter by country
DROP POLICY IF EXISTS "Cars are viewable by users from the same country" ON public.cars;

CREATE POLICY "Cars are viewable by users from the same country" 
ON public.cars
FOR SELECT
USING (
  country_id = (SELECT c.id FROM public.countries c WHERE c.id = (
    SELECT p.country_id FROM public.profiles p WHERE p.id = auth.uid()
  ))
  OR country_id IS NULL
);

-- Create function to filter cars by country
CREATE OR REPLACE FUNCTION public.get_cars_by_country(country_id integer)
RETURNS SETOF public.cars AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM public.cars c
  WHERE c.country_id = country_id
  OR c.country_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update car country based on user profile
CREATE OR REPLACE FUNCTION public.set_car_country()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.country_id IS NULL THEN
    NEW.country_id := (
      SELECT p.country_id 
      FROM public.profiles p 
      WHERE p.id = auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set country_id when inserting a new car
DROP TRIGGER IF EXISTS set_car_country_trigger ON public.cars;

CREATE TRIGGER set_car_country_trigger
BEFORE INSERT ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.set_car_country();
