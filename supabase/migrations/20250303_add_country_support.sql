-- Create countries table
CREATE TABLE IF NOT EXISTS public.countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    code VARCHAR(2) NOT NULL UNIQUE,
    phone_code VARCHAR(5) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    currency_symbol VARCHAR(5) NOT NULL,
    currency_name VARCHAR(50) NOT NULL,
    currency_name_ar VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cities table
CREATE TABLE IF NOT EXISTS public.cities (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(country_id, name)
);

-- Add country_id to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES public.cities(id);

-- Add country_id to cars table
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES public.countries(id),
ADD COLUMN IF NOT EXISTS city_id INTEGER REFERENCES public.cities(id);

-- Add updated_at triggers for new tables
CREATE TRIGGER update_countries_updated_at
    BEFORE UPDATE ON public.countries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON public.cities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert initial countries data
INSERT INTO public.countries (name, name_ar, code, phone_code, currency_code, currency_symbol, currency_name, currency_name_ar)
VALUES 
    ('Qatar', 'قطر', 'QA', '+974', 'QAR', 'ر.ق', 'Qatari Riyal', 'ريال قطري'),
    ('Saudi Arabia', 'المملكة العربية السعودية', 'SA', '+966', 'SAR', 'ر.س', 'Saudi Riyal', 'ريال سعودي'),
    ('United Arab Emirates', 'الإمارات العربية المتحدة', 'AE', '+971', 'AED', 'د.إ', 'UAE Dirham', 'درهم إماراتي'),
    ('Kuwait', 'الكويت', 'KW', '+965', 'KWD', 'د.ك', 'Kuwaiti Dinar', 'دينار كويتي'),
    ('Syria', 'سوريا', 'SY', '+963', 'SYP', 'ل.س', 'Syrian Pound', 'ليرة سورية')
ON CONFLICT (code) DO NOTHING;

-- Insert some initial cities
-- Qatar cities
INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Doha', 'الدوحة' FROM public.countries WHERE code = 'QA'
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Al Wakrah', 'الوكرة' FROM public.countries WHERE code = 'QA'
ON CONFLICT (country_id, name) DO NOTHING;

-- Saudi Arabia cities
INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Riyadh', 'الرياض' FROM public.countries WHERE code = 'SA'
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Jeddah', 'جدة' FROM public.countries WHERE code = 'SA'
ON CONFLICT (country_id, name) DO NOTHING;

-- UAE cities
INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Dubai', 'دبي' FROM public.countries WHERE code = 'AE'
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Abu Dhabi', 'أبو ظبي' FROM public.countries WHERE code = 'AE'
ON CONFLICT (country_id, name) DO NOTHING;

-- Kuwait cities
INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Kuwait City', 'مدينة الكويت' FROM public.countries WHERE code = 'KW'
ON CONFLICT (country_id, name) DO NOTHING;

-- Syria cities
INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Damascus', 'دمشق' FROM public.countries WHERE code = 'SY'
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO public.cities (country_id, name, name_ar)
SELECT id, 'Aleppo', 'حلب' FROM public.countries WHERE code = 'SY'
ON CONFLICT (country_id, name) DO NOTHING;

-- Create RLS policies for countries and cities
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on countries" 
ON public.countries FOR SELECT 
USING (true);

CREATE POLICY "Enable read access for all users on cities" 
ON public.cities FOR SELECT 
USING (true);

CREATE POLICY "Enable insert/update for admins on countries" 
ON public.countries FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Enable insert/update for admins on cities" 
ON public.cities FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create function to get user's country based on IP
CREATE OR REPLACE FUNCTION get_country_from_ip(client_ip text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    country_code text;
BEGIN
    -- This is a simplified version. In production, you'd use a proper IP geolocation service
    -- For now, we'll just return a default value
    RETURN 'QA';
END;
$$;

-- Create function to get user's country data
CREATE OR REPLACE FUNCTION get_user_country()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    user_country jsonb;
    ip_country_code text;
BEGIN
    -- First check if the user is authenticated and has a country set
    IF auth.uid() IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'name_ar', c.name_ar,
            'currency_code', c.currency_code,
            'currency_symbol', c.currency_symbol,
            'currency_name', c.currency_name,
            'currency_name_ar', c.currency_name_ar,
            'phone_code', c.phone_code
        ) INTO user_country
        FROM public.profiles p
        JOIN public.countries c ON p.country_id = c.id
        WHERE p.id = auth.uid() AND c.is_active = true;
        
        IF user_country IS NOT NULL THEN
            RETURN user_country;
        END IF;
    END IF;
    
    -- If user doesn't have a country set or is not authenticated, use IP
    ip_country_code := get_country_from_ip(request.header('X-Forwarded-For'));
    
    SELECT jsonb_build_object(
        'id', c.id,
        'code', c.code,
        'name', c.name,
        'name_ar', c.name_ar,
        'currency_code', c.currency_code,
        'currency_symbol', c.currency_symbol,
        'currency_name', c.currency_name,
        'currency_name_ar', c.currency_name_ar,
        'phone_code', c.phone_code
    ) INTO user_country
    FROM public.countries c
    WHERE c.code = ip_country_code AND c.is_active = true;
    
    -- Default to Qatar if no match
    IF user_country IS NULL THEN
        SELECT jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'name', c.name,
            'name_ar', c.name_ar,
            'currency_code', c.currency_code,
            'currency_symbol', c.currency_symbol,
            'currency_name', c.currency_name,
            'currency_name_ar', c.currency_name_ar,
            'phone_code', c.phone_code
        ) INTO user_country
        FROM public.countries c
        WHERE c.code = 'QA' AND c.is_active = true;
    END IF;
    
    RETURN user_country;
END;
$$;
