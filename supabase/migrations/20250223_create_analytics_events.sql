-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type VARCHAR NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    session_id UUID NOT NULL,
    page_url TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Add views_count column to cars table if it doesn't exist
ALTER TABLE cars ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Function to increment car views
CREATE OR REPLACE FUNCTION increment_car_views()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.event_type = 'car_view' AND NEW.event_data->>'car_id' IS NOT NULL THEN
        UPDATE cars
        SET views_count = views_count + 1
        WHERE id = (NEW.event_data->>'car_id')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment car views
DROP TRIGGER IF EXISTS increment_car_views_trigger ON analytics_events;
CREATE TRIGGER increment_car_views_trigger
    AFTER INSERT ON analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION increment_car_views();

-- Function to clean up old analytics events
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
    -- Delete events older than 90 days
    DELETE FROM analytics_events
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old events (runs daily)
SELECT cron.schedule(
    'cleanup-old-analytics-events',
    '0 0 * * *', -- Run at midnight every day
    'SELECT cleanup_old_analytics_events();'
);
