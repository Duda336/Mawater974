-- Fix RLS policies for dealership_requests to allow admins to see all requests

-- Create policy for admins to view all dealership requests
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view all dealership requests" ON dealership_requests;
    
    CREATE POLICY "Admins can view all dealership requests"
    ON dealership_requests FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
END
$$;

-- Create policy for admins to update dealership requests
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can update dealership requests" ON dealership_requests;
    
    CREATE POLICY "Admins can update dealership requests"
    ON dealership_requests FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
END
$$;
