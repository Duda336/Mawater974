-- Add country_id column to dealerships table
ALTER TABLE dealerships ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id);
ALTER TABLE dealerships ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES cities(id);

-- Update existing dealerships to have the default country (Qatar)
UPDATE dealerships SET country_id = (SELECT id FROM countries WHERE code = 'QA' LIMIT 1) WHERE country_id IS NULL;

-- Add an index on country_id for better query performance
CREATE INDEX IF NOT EXISTS idx_dealerships_country_id ON dealerships(country_id);
