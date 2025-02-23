-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR NOT NULL,
    event_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    session_id VARCHAR,
    page_url VARCHAR,
    user_agent VARCHAR
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- Add views_count column to cars table if it doesn't exist
ALTER TABLE cars ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create function to increment views_count
CREATE OR REPLACE FUNCTION increment_car_views()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'car_view' THEN
        UPDATE cars
        SET views_count = views_count + 1
        WHERE id = (NEW.event_data->>'car_id')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment views_count
CREATE TRIGGER increment_car_views_trigger
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION increment_car_views();
