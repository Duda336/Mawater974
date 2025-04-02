-- Add featured column to cars table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cars' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.cars
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create index for faster querying of featured cars if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE indexname = 'idx_cars_is_featured'
    ) THEN
        CREATE INDEX idx_cars_is_featured ON public.cars(is_featured);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.cars;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cars;
    DROP POLICY IF EXISTS "Enable update for admin users" ON public.cars;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for all users"
ON public.cars FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON public.cars FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for admin users"
ON public.cars FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
