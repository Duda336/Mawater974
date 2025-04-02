-- Drop the existing enum type if it exists
DROP TYPE IF EXISTS cylinders_type CASCADE;

-- Create the new enum type with all possible values including 'Electric'
DO $$ BEGIN
    CREATE TYPE cylinders_type AS ENUM (
        'Electric',
        '3',
        '4',
        '5',
        '6',
        '8',
        '10',
        '12',
        '16'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- First add the cylinders column if it doesn't exist
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS cylinders text;

-- Now convert the column to use the enum type
ALTER TABLE cars 
ALTER COLUMN cylinders TYPE cylinders_type USING 
    CASE 
        WHEN cylinders IS NULL THEN NULL
        ELSE cylinders::cylinders_type 
    END;
