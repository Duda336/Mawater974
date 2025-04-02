-- Update the logo_url column to use TEXT type to handle base64 encoded images
ALTER TABLE dealerships 
ALTER COLUMN logo_url TYPE TEXT;
