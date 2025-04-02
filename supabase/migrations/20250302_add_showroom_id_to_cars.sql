-- Add dealership_id to cars table
ALTER TABLE public.cars ADD COLUMN dealership_id bigint NULL;

-- Add foreign key constraint
ALTER TABLE public.cars 
ADD CONSTRAINT cars_dealership_id_fkey 
FOREIGN KEY (dealership_id) 
REFERENCES public.dealerships(id) 
ON DELETE SET NULL;

-- Create index for dealership_id for better query performance
CREATE INDEX idx_cars_dealership_id ON public.cars(dealership_id);

-- Update RLS policies to allow dealership owners/staff to manage their cars
CREATE POLICY "Enable all access for dealership owners and staff" ON public.cars
FOR ALL
USING (
    dealership_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM dealerships s
        WHERE s.id = cars.dealership_id
        AND (s.user_id = auth.uid())
    )
);

-- Function to update car_listings when cars are updated (if needed)
CREATE OR REPLACE FUNCTION sync_car_to_listing()
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be expanded to sync data between cars and car_listings
    -- if both tables need to be maintained
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep car_listings in sync with cars (if needed)
-- Uncomment if you need this functionality
/*
CREATE TRIGGER sync_car_listing_trigger
AFTER INSERT OR UPDATE ON cars
FOR EACH ROW
EXECUTE FUNCTION sync_car_to_listing();
*/

-- Add a comment to the dealership_id column for documentation
COMMENT ON COLUMN public.cars.dealership_id IS 'References the dealership that this car belongs to. NULL for cars not associated with a dealership.';
