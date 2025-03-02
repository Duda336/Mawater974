-- Migration to consolidate dealership_requests and dealership_profiles into a single table
-- with fixed enums for dealership_type, business_type, and status
-- Updated version: Removed is_active and is_verified fields as they're redundant with status

-- Start a transaction to ensure all changes happen together or not at all
BEGIN;

-- 1. Create ENUM types for dealership_type, business_type, and status
DO $$
BEGIN
    -- Create dealership_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealership_type_enum') THEN
        CREATE TYPE dealership_type_enum AS ENUM ('private', 'official');
    END IF;

    -- Create business_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type_enum') THEN
        CREATE TYPE business_type_enum AS ENUM ('showroom', 'service_center', 'spare_parts_dealer');
    END IF;

    -- Create dealership_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dealership_status_enum') THEN
        CREATE TYPE dealership_status_enum AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

-- 2. Create a new consolidated dealership table
CREATE TABLE IF NOT EXISTS dealerships (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    business_name TEXT NOT NULL,
    business_name_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    location TEXT NOT NULL,
    dealership_type dealership_type_enum NOT NULL,
    business_type business_type_enum NOT NULL,
    logo_url TEXT,
    status dealership_status_enum NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    review_notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT dealerships_user_id_key UNIQUE (user_id)
);

-- 3. Create trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_dealerships_updated_at'
    ) THEN
        CREATE TRIGGER update_dealerships_updated_at
        BEFORE UPDATE ON dealerships
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 4. Enable RLS on the new table
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the new table
-- Allow users to view their own dealership records
CREATE POLICY "Users can view their own dealership records"
ON dealerships FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to create dealership records
CREATE POLICY "Users can create dealership records"
ON dealerships FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own dealership records if not approved/rejected
CREATE POLICY "Users can update their own pending dealership records"
ON dealerships FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() AND 
    status = 'pending'
);

-- Allow admins to view all dealership records
CREATE POLICY "Admins can view all dealership records"
ON dealerships FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow admins to update any dealership record
CREATE POLICY "Admins can update any dealership record"
ON dealerships FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 6. Migrate data from existing tables to the new table
-- First, insert data from dealership_requests
INSERT INTO dealerships (
    user_id,
    business_name,
    business_name_ar,
    description,
    description_ar,
    location,
    dealership_type,
    business_type,
    logo_url,
    status,
    created_at,
    updated_at
)
SELECT
    user_id,
    business_name,
    business_name_ar,
    description,
    description_ar,
    location,
    -- Convert text to enum, with fallback to 'private' if invalid
    CASE 
        WHEN dealership_type = 'official' THEN 'official'::dealership_type_enum
        ELSE 'private'::dealership_type_enum
    END,
    -- Convert text to enum, with fallback to 'showroom' if invalid
    CASE 
        WHEN business_type = 'service_center' THEN 'service_center'::business_type_enum
        WHEN business_type = 'spare_parts_dealer' THEN 'spare_parts_dealer'::business_type_enum
        ELSE 'showroom'::business_type_enum
    END,
    logo_url,
    -- Convert text to enum
    CASE 
        WHEN status = 'approved' THEN 'approved'::dealership_status_enum
        WHEN status = 'rejected' THEN 'rejected'::dealership_status_enum
        ELSE 'pending'::dealership_status_enum
    END,
    created_at,
    updated_at
FROM dealership_requests
ON CONFLICT (user_id) DO NOTHING;

-- 7. Create function to approve dealership
CREATE OR REPLACE FUNCTION approve_dealership(dealership_id BIGINT, reviewer_id UUID, notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    result JSONB;
BEGIN
    -- Get the user_id from the dealership and update it
    UPDATE dealerships
    SET status = 'approved',
        reviewer_id = approve_dealership.reviewer_id,
        review_notes = notes,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = dealership_id AND status = 'pending'
    RETURNING user_id INTO v_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Dealership not found or not pending'
        );
    END IF;

    -- Update user profile to dealer type
    UPDATE profiles
    SET user_type = 'dealer'
    WHERE id = v_user_id;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Dealership approved successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error approving dealership: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to reject dealership
CREATE OR REPLACE FUNCTION reject_dealership(dealership_id BIGINT, reviewer_id UUID, notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update the dealership status
    UPDATE dealerships
    SET status = 'rejected',
        reviewer_id = reject_dealership.reviewer_id,
        review_notes = notes,
        reviewed_at = NOW(),
        updated_at = NOW()
    WHERE id = dealership_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Dealership not found or not pending'
        );
    END IF;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Dealership rejected successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error rejecting dealership: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW dealership_requests_view AS
SELECT
    id,
    user_id,
    business_name,
    business_name_ar,
    description,
    description_ar,
    location,
    dealership_type::TEXT,
    business_type::TEXT,
    logo_url,
    status::TEXT,
    created_at,
    updated_at
FROM dealerships;

CREATE OR REPLACE VIEW dealership_profiles_view AS
SELECT
    id,
    user_id,
    business_name,
    business_name_ar,
    description,
    description_ar,
    logo_url,
    location,
    dealership_type::TEXT,
    business_type::TEXT,
    created_at,
    updated_at
FROM dealerships
WHERE status = 'approved';

-- Commit the transaction
COMMIT;
