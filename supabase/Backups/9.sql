-- Drop existing car_status enum type
DROP TYPE IF EXISTS car_status CASCADE;

-- Recreate car_status enum with Rejected status
CREATE TYPE car_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Sold');

-- Update cars table to use new enum
ALTER TABLE cars 
    ALTER COLUMN status TYPE car_status USING status::text::car_status;
