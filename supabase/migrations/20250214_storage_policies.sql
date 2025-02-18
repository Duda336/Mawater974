-- Enable Storage RLS
BEGIN;

-- Create car-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public to view car images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload car images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own car images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own car images" ON storage.objects;

-- Allow public to view car images
CREATE POLICY "Allow public to view car images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

-- Allow authenticated users to insert car images
CREATE POLICY "Allow authenticated users to upload car images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own car images
CREATE POLICY "Allow users to update their own car images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own car images
CREATE POLICY "Allow users to delete their own car images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'car-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
