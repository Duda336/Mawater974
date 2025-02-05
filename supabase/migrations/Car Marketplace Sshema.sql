-- Create enum types
CREATE TYPE user_role AS ENUM ('normal_user', 'admin');
CREATE TYPE fuel_type AS ENUM ('Petrol', 'Diesel', 'Hybrid', 'Electric');
CREATE TYPE gearbox_type AS ENUM ('Manual', 'Automatic');
CREATE TYPE body_type AS ENUM ('Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Van', 'Wagon', 'Convertible', 'Other');
CREATE TYPE car_condition AS ENUM ('New', 'Excellent', 'Good', 'Not Working');
CREATE TYPE car_status AS ENUM ('Pending', 'Approved', 'Sold');
CREATE TYPE car_color AS ENUM (
    'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 
    'Green', 'Yellow', 'Brown', 'Gold', 'Orange', 'Purple', 
    'Beige', 'Bronze', 'Maroon', 'Navy', 'Other'
);
CREATE TYPE cylinders_type AS ENUM (
    '3', '4', '5', '6', '8', '10', '12', '16'
);

-- Create Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name VARCHAR(255),
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'normal_user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_phone CHECK (phone_number ~ '^\+?[0-9]{10,15}$'),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create Brands table
CREATE TABLE public.brands (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Models table
CREATE TABLE public.models (
    id BIGSERIAL PRIMARY KEY,
    brand_id BIGINT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(brand_id, name)
);

-- Create Cars table
CREATE TABLE public.cars (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    brand_id BIGINT NOT NULL REFERENCES public.brands(id),
    model_id BIGINT NOT NULL REFERENCES public.models(id),
    year INTEGER NOT NULL,
    mileage INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    color car_color NOT NULL DEFAULT 'Other',
    cylinders cylinders_type,
    description TEXT,
    fuel_type fuel_type NOT NULL,
    gearbox_type gearbox_type NOT NULL,
    body_type body_type NOT NULL,
    condition car_condition NOT NULL,
    status car_status NOT NULL DEFAULT 'Pending',
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    thumbnail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_year CHECK (year BETWEEN 1900 AND EXTRACT(YEAR FROM NOW())),
    CONSTRAINT valid_mileage CHECK (mileage >= 0),
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT price_in_qar CHECK (price = ROUND(price, 2)) -- Ensure price is in QAR with 2 decimal places
);

-- Create car_images table
CREATE TABLE public.car_images (
    id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create function to validate car model belongs to brand
CREATE OR REPLACE FUNCTION validate_car_model_brand()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.models m
        WHERE m.id = NEW.model_id AND m.brand_id = NEW.brand_id
    ) THEN
        RAISE EXCEPTION 'Model % does not belong to brand %', NEW.model_id, NEW.brand_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate car model brand relationship
CREATE TRIGGER ensure_valid_car_model_brand
    BEFORE INSERT OR UPDATE ON public.cars
    FOR EACH ROW
    EXECUTE FUNCTION validate_car_model_brand();

-- Create Favorites table
CREATE TABLE public.favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    car_id BIGINT NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, car_id)
);

-- Create admin logs table
CREATE TABLE public.admin_logs (
    id BIGSERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES public.profiles(id),
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id BIGINT NOT NULL,
    changes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON public.models
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at
    BEFORE UPDATE ON public.cars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_car_images_updated_at
    BEFORE UPDATE ON public.car_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert initial brands and models
INSERT INTO public.brands (name) VALUES
    ('Toyota'),
    ('Honda'),
    ('BMW'),
    ('Mercedes-Benz'),
    ('Audi'),
    ('Lexus'),
    ('Nissan'),
    ('Hyundai'),
    ('Kia'),
    ('Ford'),
    ('Chevrolet'),
    ('Volkswagen'),
    ('Mazda'),
    ('Subaru'),
    ('Porsche'),
    ('Land Rover'),
    ('Jaguar'),
    ('Volvo'),
    ('Tesla'),
    ('Jeep')
ON CONFLICT (name) DO NOTHING;

-- Insert models for major brands
DO $$
DECLARE
    v_brand_id BIGINT;
BEGIN
    -- Toyota
    SELECT id INTO v_brand_id FROM public.brands WHERE name = 'Toyota';
    IF FOUND THEN
        INSERT INTO public.models (name, brand_id) VALUES
            ('Camry', v_brand_id),
            ('Corolla', v_brand_id),
            ('RAV4', v_brand_id),
            ('Highlander', v_brand_id),
            ('Land Cruiser', v_brand_id)
        ON CONFLICT (brand_id, name) DO NOTHING;
    END IF;

    -- Honda
    SELECT id INTO v_brand_id FROM public.brands WHERE name = 'Honda';
    IF FOUND THEN
        INSERT INTO public.models (name, brand_id) VALUES
            ('Civic', v_brand_id),
            ('Accord', v_brand_id),
            ('CR-V', v_brand_id),
            ('Pilot', v_brand_id),
            ('HR-V', v_brand_id)
        ON CONFLICT (brand_id, name) DO NOTHING;
    END IF;

    -- BMW
    SELECT id INTO v_brand_id FROM public.brands WHERE name = 'BMW';
    IF FOUND THEN
        INSERT INTO public.models (name, brand_id) VALUES
            ('3 Series', v_brand_id),
            ('5 Series', v_brand_id),
            ('7 Series', v_brand_id),
            ('X3', v_brand_id),
            ('X5', v_brand_id)
        ON CONFLICT (brand_id, name) DO NOTHING;
    END IF;

    -- Mercedes-Benz
    SELECT id INTO v_brand_id FROM public.brands WHERE name = 'Mercedes-Benz';
    IF FOUND THEN
        INSERT INTO public.models (name, brand_id) VALUES
            ('C-Class', v_brand_id),
            ('E-Class', v_brand_id),
            ('S-Class', v_brand_id),
            ('GLC', v_brand_id),
            ('GLE', v_brand_id)
        ON CONFLICT (brand_id, name) DO NOTHING;
    END IF;

    -- Audi
    SELECT id INTO v_brand_id FROM public.brands WHERE name = 'Audi';
    IF FOUND THEN
        INSERT INTO public.models (name, brand_id) VALUES
            ('A3', v_brand_id),
            ('A4', v_brand_id),
            ('A6', v_brand_id),
            ('Q5', v_brand_id),
            ('Q7', v_brand_id)
        ON CONFLICT (brand_id, name) DO NOTHING;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for brands table
CREATE POLICY "Enable read access for all users" ON public.brands
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admin users only" ON public.brands
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable update for admin users only" ON public.brands
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admin users only" ON public.brands
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create policies for models table
CREATE POLICY "Enable read access for all users" ON public.models
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for admin users only" ON public.models
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable update for admin users only" ON public.models
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for admin users only" ON public.models
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create policies for cars table
CREATE POLICY "Enable read access for all users" ON public.cars
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.cars
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for owners and admins" ON public.cars
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Enable delete for owners and admins" ON public.cars
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create policies for car_images table
CREATE POLICY "Enable read access for all users" ON public.car_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for car owners" ON public.car_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cars
            WHERE cars.id = car_id
            AND cars.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable update for car owners" ON public.car_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.cars
            WHERE cars.id = car_id
            AND cars.user_id = auth.uid()
        )
    );

CREATE POLICY "Enable delete for car owners" ON public.car_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.cars
            WHERE cars.id = car_id
            AND cars.user_id = auth.uid()
        )
    );

-- Create policies for favorites table
CREATE POLICY "Enable read access for authenticated users" ON public.favorites
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable insert for authenticated users" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for owners" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);
