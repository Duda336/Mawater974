-- Migration to drop old dealership tables and views
-- This script should be run after the consolidation script has been applied
-- and all data has been migrated to the new dealerships table

-- Start a transaction to ensure all changes happen together or not at all
BEGIN;

-- 1. First drop any views that depend on the tables
DROP VIEW IF EXISTS dealership_requests_view;
DROP VIEW IF EXISTS dealership_profiles_view;

-- 2. Drop functions that reference the old tables
DROP FUNCTION IF EXISTS approve_dealership_request(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_dealership_request(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS approve_dealership_registration(BIGINT, UUID, TEXT);
DROP FUNCTION IF EXISTS reject_dealership_registration(BIGINT, UUID, TEXT);

-- 3. Check for and drop any foreign keys that reference these tables
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    -- Find and drop foreign keys referencing dealership_requests
    FOR fk_record IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'dealership_requests'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || fk_record.table_name || ' DROP CONSTRAINT ' || fk_record.constraint_name;
    END LOOP;

    -- Find and drop foreign keys referencing dealership_profiles
    FOR fk_record IN (
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'dealership_profiles'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || fk_record.table_name || ' DROP CONSTRAINT ' || fk_record.constraint_name;
    END LOOP;
END $$;

-- 4. Drop the tables
DROP TABLE IF EXISTS dealership_requests;
DROP TABLE IF EXISTS dealership_profiles;

-- 5. Log the operation
DO $$
BEGIN
    RAISE NOTICE 'Old dealership tables and views have been dropped successfully.';
END $$;

-- Commit the transaction
COMMIT;
