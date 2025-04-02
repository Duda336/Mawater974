-- Migration to remove city_id from profiles table

-- First, drop any foreign key constraints if they exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'profiles' 
        AND ccu.column_name = 'city_id'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE profiles DROP CONSTRAINT ' || tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'profiles' 
            AND ccu.column_name = 'city_id'
            LIMIT 1
        );
    END IF;
END
$$;

-- Now, remove the city_id column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS city_id;

-- Update any functions that might reference the city_id column
-- The update_user_profile function has already been updated in previous migrations
