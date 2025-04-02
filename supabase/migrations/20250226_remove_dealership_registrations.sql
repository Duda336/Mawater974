-- Migration to safely remove the dealership_registrations table
-- This script will:
-- 1. Remove the foreign key constraint from dealership_profiles
-- 2. Drop the old approval/rejection functions that use dealership_registrations
-- 3. Drop the dealership_registrations table

-- Start a transaction to ensure all changes happen together or not at all
BEGIN;

-- 1. Remove the foreign key constraint from dealership_profiles
DO $$
BEGIN
    -- Check if the constraint exists before trying to drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'dealership_profiles_registration_id_fkey' 
        AND table_name = 'dealership_profiles'
    ) THEN
        ALTER TABLE dealership_profiles DROP CONSTRAINT dealership_profiles_registration_id_fkey;
    END IF;
    
    -- Set registration_id to NULL for all dealership profiles
    UPDATE dealership_profiles SET registration_id = NULL;
    
    -- Drop the column if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'dealership_profiles' 
        AND column_name = 'registration_id'
    ) THEN
        ALTER TABLE dealership_profiles DROP COLUMN registration_id;
    END IF;
END $$;

-- 2. Drop the old approval/rejection functions that use dealership_registrations
-- These are replaced by the new functions in 20250226_dealership_approval_functions.sql
DROP FUNCTION IF EXISTS approve_dealership_registration(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_dealership_registration(BIGINT, UUID, TEXT);

-- 3. Drop the dealership_registrations table if it exists
DROP TABLE IF EXISTS dealership_registrations;

-- Commit the transaction
COMMIT;
