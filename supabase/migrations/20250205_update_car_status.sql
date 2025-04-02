-- First, remove the default value constraint
ALTER TABLE cars ALTER COLUMN status DROP DEFAULT;

-- Convert the column to text temporarily
ALTER TABLE cars ALTER COLUMN status TYPE text;

-- Drop the enum type with CASCADE
DROP TYPE car_status CASCADE;

-- Create new enum type with Rejected status
CREATE TYPE car_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Sold');

-- Convert the column back to the new enum type
ALTER TABLE cars ALTER COLUMN status TYPE car_status USING status::car_status;

-- Add back the NOT NULL and DEFAULT constraints
ALTER TABLE cars ALTER COLUMN status SET NOT NULL;
ALTER TABLE cars ALTER COLUMN status SET DEFAULT 'Pending'::car_status;
