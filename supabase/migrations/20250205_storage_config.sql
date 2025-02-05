-- Update existing bucket configuration without deleting it
UPDATE storage.buckets 
SET 
    public = true,
    file_size_limit = 52428800, -- 50MB limit
    allowed_mime_types = ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ]
WHERE id = 'car-images';

-- Insert the bucket only if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, owner)
SELECT 
    'car-images',
    'car-images',
    true,
    52428800, -- 50MB limit
    ARRAY[
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ],
    NULL -- public bucket
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'car-images'
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files" ON storage.objects;

-- Create policies
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'car-images');

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'car-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'car-images' AND auth.uid()::text = (storage.foldername(name))[1]);
