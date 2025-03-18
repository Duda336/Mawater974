-- Add country_code column to car_reports table if it doesn't exist
ALTER TABLE car_reports ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'QA' NOT NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS car_reports_country_code_idx ON car_reports(country_code);
