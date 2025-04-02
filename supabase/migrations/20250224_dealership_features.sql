-- Link users to dealerships
ALTER TABLE showrooms ADD COLUMN owner_id UUID REFERENCES auth.users(id);
ALTER TABLE showrooms ADD COLUMN staff_ids UUID[] DEFAULT '{}';

-- Create table for car listings
CREATE TABLE car_listings (
    id BIGSERIAL PRIMARY KEY,
    showroom_id BIGINT REFERENCES showrooms(id),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT NOT NULL,
    description_ar TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    year INTEGER NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    trim TEXT,
    mileage INTEGER,
    exterior_color TEXT,
    interior_color TEXT,
    transmission TEXT,
    fuel_type TEXT,
    body_type TEXT,
    condition TEXT,
    features TEXT[],
    images TEXT[],
    status TEXT DEFAULT 'active',
    is_featured BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create table for showroom staff invitations
CREATE TABLE showroom_invitations (
    id BIGSERIAL PRIMARY KEY,
    showroom_id BIGINT REFERENCES showrooms(id),
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create table for showroom analytics
CREATE TABLE showroom_analytics (
    id BIGSERIAL PRIMARY KEY,
    showroom_id BIGINT REFERENCES showrooms(id),
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    listing_views INTEGER DEFAULT 0,
    contact_requests INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0
);

-- Create table for customer inquiries
CREATE TABLE customer_inquiries (
    id BIGSERIAL PRIMARY KEY,
    showroom_id BIGINT REFERENCES showrooms(id),
    listing_id BIGINT REFERENCES car_listings(id),
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Add triggers for updated_at
CREATE TRIGGER update_car_listings_updated_at
    BEFORE UPDATE ON car_listings
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customer_inquiries_updated_at
    BEFORE UPDATE ON customer_inquiries
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Create indexes
CREATE INDEX idx_car_listings_showroom ON car_listings(showroom_id);
CREATE INDEX idx_car_listings_status ON car_listings(status);
CREATE INDEX idx_car_listings_make_model ON car_listings(make, model);
CREATE INDEX idx_customer_inquiries_showroom ON customer_inquiries(showroom_id);
CREATE INDEX idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX idx_showroom_analytics_date ON showroom_analytics(date);

-- RLS Policies
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE showroom_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

-- Policies for car listings
CREATE POLICY "Enable read access for all users" ON car_listings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Enable all access for showroom owners" ON car_listings
    USING (
        EXISTS (
            SELECT 1 FROM showrooms s
            WHERE s.id = car_listings.showroom_id
            AND (s.owner_id = auth.uid() OR auth.uid() = ANY(s.staff_ids))
        )
    );

-- Policies for showroom invitations
CREATE POLICY "Enable access for showroom owners" ON showroom_invitations
    USING (
        EXISTS (
            SELECT 1 FROM showrooms s
            WHERE s.id = showroom_invitations.showroom_id
            AND s.owner_id = auth.uid()
        )
    );

-- Policies for showroom analytics
CREATE POLICY "Enable access for showroom staff" ON showroom_analytics
    USING (
        EXISTS (
            SELECT 1 FROM showrooms s
            WHERE s.id = showroom_analytics.showroom_id
            AND (s.owner_id = auth.uid() OR auth.uid() = ANY(s.staff_ids))
        )
    );

-- Policies for customer inquiries
CREATE POLICY "Enable insert for all users" ON customer_inquiries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable access for showroom staff" ON customer_inquiries
    USING (
        EXISTS (
            SELECT 1 FROM showrooms s
            WHERE s.id = customer_inquiries.showroom_id
            AND (s.owner_id = auth.uid() OR auth.uid() = ANY(s.staff_ids))
        )
    );

-- Storage policies for car images
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'car-images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true);
    END IF;
END $$;

-- Create policies for car images bucket if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow public read access for car images'
    ) THEN
        CREATE POLICY "Allow public read access for car images" ON storage.objects
            FOR SELECT USING (bucket_id = 'car-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Allow showroom staff insert access for car images'
    ) THEN
        CREATE POLICY "Allow showroom staff insert access for car images" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'car-images' AND (
                    EXISTS (
                        SELECT 1 FROM showrooms s
                        WHERE s.owner_id = auth.uid()
                        OR auth.uid() = ANY(s.staff_ids)
                    )
                )
            );
    END IF;
END $$;
