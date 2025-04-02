-- Migration to add featured flag and location_ar to dealerships table
BEGIN;

-- Add featured column to dealerships table
ALTER TABLE dealerships 
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Add location_ar column to dealerships table
ALTER TABLE dealerships 
ADD COLUMN IF NOT EXISTS location_ar TEXT DEFAULT '';

-- Update RLS policies to include new columns
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can read all dealerships" ON dealerships;
    DROP POLICY IF EXISTS "Users can update their own dealership" ON dealerships;
    DROP POLICY IF EXISTS "Admins can update any dealership" ON dealerships;
    
    -- Recreate policies with new columns
    CREATE POLICY "Users can read all dealerships" 
    ON dealerships FOR SELECT 
    USING (true);
    
    CREATE POLICY "Users can update their own dealership" 
    ON dealerships FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "Admins can update any dealership" 
    ON dealerships FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
END $$;

COMMIT;
