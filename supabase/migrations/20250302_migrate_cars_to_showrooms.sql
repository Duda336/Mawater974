-- Function to migrate existing cars to dealerships
CREATE OR REPLACE FUNCTION migrate_cars_to_dealerships()
RETURNS void AS $$
DECLARE
    car_record RECORD;
    dealer_id BIGINT;
BEGIN
    -- Loop through all cars
    FOR car_record IN SELECT id, user_id FROM public.cars WHERE cars.dealership_id IS NULL
    LOOP
        -- Find a dealership owned by the car's user
        SELECT id INTO dealer_id 
        FROM public.dealerships 
        WHERE user_id = car_record.user_id 
        LIMIT 1;
        
        -- If a dealership is found, update the car
        IF dealer_id IS NOT NULL THEN
            UPDATE public.cars 
            SET dealership_id = dealer_id 
            WHERE id = car_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_cars_to_dealerships();

-- Drop the function after use
DROP FUNCTION migrate_cars_to_dealerships();

-- Add a function to automatically set dealership_id when a car is created
CREATE OR REPLACE FUNCTION set_car_dealership_id()
RETURNS TRIGGER AS $$
DECLARE
    dealer_id BIGINT;
BEGIN
    -- If dealership_id is already set, do nothing
    IF NEW.dealership_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Find a dealership owned by the user
    SELECT id INTO dealer_id 
    FROM public.dealerships 
    WHERE user_id = NEW.user_id 
    LIMIT 1;
    
    -- If a dealership is found, set the dealership_id
    IF dealer_id IS NOT NULL THEN
        NEW.dealership_id := dealer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set dealership_id
CREATE TRIGGER set_car_dealership_id_trigger
BEFORE INSERT ON public.cars
FOR EACH ROW
EXECUTE FUNCTION set_car_dealership_id();
