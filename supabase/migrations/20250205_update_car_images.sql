-- First, add columns to cars table if they don't exist
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS thumbnail text;

-- Drop the existing car_images table if it exists
DROP TABLE IF EXISTS car_images;

-- Create the new car_images table with improved structure
CREATE TABLE car_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    car_id bigint REFERENCES cars(id) ON DELETE CASCADE,
    url text NOT NULL,
    is_main boolean DEFAULT false,
    display_order integer,
    created_at timestamptz DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_car_images_car_id ON car_images(car_id);
CREATE INDEX IF NOT EXISTS idx_car_images_is_main ON car_images(is_main);

-- Add RLS policies
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;

-- Allow public to view car images
CREATE POLICY "Allow public to view car images"
ON car_images FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert car images
CREATE POLICY "Allow authenticated users to insert car images"
ON car_images FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM cars
        WHERE id = car_id
        AND user_id = auth.uid()
    )
);

-- Allow users to update their own car images
CREATE POLICY "Allow users to update their own car images"
ON car_images FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM cars
        WHERE id = car_id
        AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM cars
        WHERE id = car_id
        AND user_id = auth.uid()
    )
);

-- Allow users to delete their own car images
CREATE POLICY "Allow users to delete their own car images"
ON car_images FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM cars
        WHERE id = car_id
        AND user_id = auth.uid()
    )
);
