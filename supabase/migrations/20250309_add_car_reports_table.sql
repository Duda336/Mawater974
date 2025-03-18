-- Create car_reports table
CREATE TABLE IF NOT EXISTS car_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id BIGINT NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- Pending, Reviewed, Resolved, Dismissed
  country_code VARCHAR(2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS car_reports_car_id_idx ON car_reports(car_id);
CREATE INDEX IF NOT EXISTS car_reports_user_id_idx ON car_reports(user_id);
CREATE INDEX IF NOT EXISTS car_reports_status_idx ON car_reports(status);
CREATE INDEX IF NOT EXISTS car_reports_country_code_idx ON car_reports(country_code);

-- Add RLS policies
ALTER TABLE car_reports ENABLE ROW LEVEL SECURITY;

-- Admins can see all reports
CREATE POLICY "Admins can see all reports" 
ON car_reports 
FOR SELECT 
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Users can see their own reports
CREATE POLICY "Users can see their own reports" 
ON car_reports 
FOR SELECT 
USING (
  auth.uid() = user_id
);

-- Users can create reports
CREATE POLICY "Users can create reports" 
ON car_reports 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);

-- Only admins can update reports
CREATE POLICY "Only admins can update reports" 
ON car_reports 
FOR UPDATE 
USING (
  auth.jwt() ->> 'role' = 'admin'
);
