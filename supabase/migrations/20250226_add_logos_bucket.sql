-- Create logos bucket for dealer logos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'logos') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'logos',
            'logos',
            true,
            5242880, -- 5MB limit
            ARRAY[
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp'
            ]
        );
    END IF;
END $$;

-- Create policies for the logos bucket
DO $$
BEGIN
    -- Allow public to view logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow public to view logos'
    ) THEN
        CREATE POLICY "Allow public to view logos"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'logos');
    END IF;

    -- Allow authenticated users to upload logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow authenticated users to upload logos'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload logos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'logos');
    END IF;

    -- Allow users to update their own logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to update logos'
    ) THEN
        CREATE POLICY "Allow users to update logos"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'logos')
        WITH CHECK (bucket_id = 'logos');
    END IF;

    -- Allow users to delete their own logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow users to delete logos'
    ) THEN
        CREATE POLICY "Allow users to delete logos"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'logos');
    END IF;
END $$;

-- Create dealership_requests table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealership_requests') THEN
        CREATE TABLE dealership_requests (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            business_name TEXT NOT NULL,
            business_name_ar TEXT NOT NULL,
            description TEXT NOT NULL,
            description_ar TEXT NOT NULL,
            location TEXT NOT NULL,
            dealership_type TEXT NOT NULL,
            business_type TEXT NOT NULL,
            brands TEXT[] DEFAULT '{}',
            logo_url TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );

        -- Enable RLS
        ALTER TABLE dealership_requests ENABLE ROW LEVEL SECURITY;

        -- Allow users to view their own requests
        CREATE POLICY "Users can view their own dealership requests"
        ON dealership_requests FOR SELECT
        TO authenticated
        USING (user_id = auth.uid());

        -- Allow users to create requests
        CREATE POLICY "Users can create dealership requests"
        ON dealership_requests FOR INSERT
        TO authenticated
        WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

-- Add trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_dealership_requests_updated_at'
    ) THEN
        CREATE TRIGGER update_dealership_requests_updated_at
        BEFORE UPDATE ON dealership_requests
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
