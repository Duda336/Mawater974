CREATE POLICY "Allow public viewing"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'car-images');