-- Add main_photo_index to cars table
ALTER TABLE cars ADD COLUMN main_photo_index INTEGER;

-- Update car_images table to support main photo marking
ALTER TABLE car_images ADD COLUMN is_main_photo BOOLEAN DEFAULT false;

-- Create a trigger to ensure only one main photo per car
CREATE OR REPLACE FUNCTION ensure_single_main_photo()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a new main photo, unset previous main photos for this car
    IF NEW.is_main_photo = true THEN
        UPDATE car_images 
        SET is_main_photo = false 
        WHERE car_id = NEW.car_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_main_photo_trigger
BEFORE INSERT OR UPDATE ON car_images
FOR EACH ROW
EXECUTE FUNCTION ensure_single_main_photo();
