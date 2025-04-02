-- Update dealership_profiles table to include all necessary fields
DO $$
BEGIN
    -- Add columns to dealership_profiles if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'business_name') THEN
        ALTER TABLE dealership_profiles ADD COLUMN business_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'business_name_ar') THEN
        ALTER TABLE dealership_profiles ADD COLUMN business_name_ar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'description') THEN
        ALTER TABLE dealership_profiles ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'description_ar') THEN
        ALTER TABLE dealership_profiles ADD COLUMN description_ar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'logo_url') THEN
        ALTER TABLE dealership_profiles ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'location') THEN
        ALTER TABLE dealership_profiles ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'dealership_type') THEN
        ALTER TABLE dealership_profiles ADD COLUMN dealership_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'business_type') THEN
        ALTER TABLE dealership_profiles ADD COLUMN business_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'brands') THEN
        ALTER TABLE dealership_profiles ADD COLUMN brands TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealership_profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE dealership_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END
$$;
