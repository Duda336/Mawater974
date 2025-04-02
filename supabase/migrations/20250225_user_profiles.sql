-- Create enum for user types if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE user_type AS ENUM ('private', 'dealer', 'admin');
    END IF;
END$$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    role text DEFAULT 'user',
    name TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Dealership profiles are viewable by everyone" ON dealership_profiles;
DROP POLICY IF EXISTS "Dealers can update own dealership profile" ON dealership_profiles;

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create dealership profiles table
CREATE TABLE IF NOT EXISTS dealership_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    registration_id BIGINT REFERENCES dealership_registrations(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(user_id)
);

-- Create RLS policies
ALTER TABLE dealership_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for dealership_profiles
CREATE POLICY "Dealership profiles are viewable by everyone"
    ON dealership_profiles FOR SELECT
    USING (true);

CREATE POLICY "Dealers can update own dealership profile"
    ON dealership_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to handle dealership approval
CREATE OR REPLACE FUNCTION approve_dealership_registration(registration_id BIGINT, reviewer_id UUID, notes TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the registration and update it
    UPDATE dealership_registrations
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewer_id = approve_dealership_registration.reviewer_id,
        review_notes = COALESCE(notes, review_notes)
    WHERE id = registration_id AND status = 'pending'
    RETURNING email INTO v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found or not pending';
    END IF;

    -- Find the user ID from the email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = (
        SELECT email 
        FROM dealership_registrations 
        WHERE id = registration_id
    );

    -- Update user role to dealer
    UPDATE profiles
    SET role = 'dealer'
    WHERE id = v_user_id;

    -- Create dealership profile
    INSERT INTO dealership_profiles (
        user_id,
        registration_id
    ) VALUES (
        v_user_id,
        registration_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject dealership registration
CREATE OR REPLACE FUNCTION reject_dealership_registration(registration_id BIGINT, reviewer_id UUID, notes TEXT DEFAULT NULL)
RETURNS void AS $$
BEGIN
    UPDATE dealership_registrations
    SET status = 'rejected',
        reviewed_at = NOW(),
        reviewer_id = reject_dealership_registration.reviewer_id,
        review_notes = COALESCE(notes, review_notes)
    WHERE id = registration_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration not found or not pending';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
