-- Add image and thumbnail columns to cars table
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS thumbnail text;

-- Create a trigger to automatically update image and thumbnail when car_images are inserted
CREATE OR REPLACE FUNCTION update_car_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the cars table with the first image URL as both image and thumbnail
  UPDATE cars
  SET 
    image = NEW.url,
    thumbnail = NEW.url
  WHERE 
    id = NEW.car_id
    AND (image IS NULL OR thumbnail IS NULL);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_car_image_inserted ON car_images;

-- Create the trigger
CREATE TRIGGER on_car_image_inserted
  AFTER INSERT ON car_images
  FOR EACH ROW
  EXECUTE FUNCTION update_car_images();
