-- Add location column to cars table
ALTER TABLE cars
ADD COLUMN location VARCHAR(50);

-- Update existing cars to have a default location if needed
UPDATE cars
SET location = 'Doha'
WHERE location IS NULL;

-- Make location required for future entries
ALTER TABLE cars
ALTER COLUMN location SET NOT NULL;

-- Optional: Create an index on location for faster searches
CREATE INDEX idx_cars_location ON cars(location);

-- Optional: Add a check constraint to ensure only valid locations
ALTER TABLE cars
ADD CONSTRAINT chk_valid_location 
CHECK (location IN ('Doha', 'Al Wakrah', 'Al Khor', 'Lusail', 'Al Rayyan', 'Umm Salal', 'Al Daayen', 'Al Shamal', 'Al Shahaniya'));