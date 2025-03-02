-- Fix user_role enum to include 'dealer' if needed

DO $$
DECLARE
    enum_exists BOOLEAN;
    enum_has_dealer BOOLEAN;
BEGIN
    -- Check if user_role enum exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) INTO enum_exists;

    IF enum_exists THEN
        -- Check if 'dealer' is already a value in the enum
        SELECT EXISTS (
            SELECT 1 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
            AND enumlabel = 'dealer'
        ) INTO enum_has_dealer;

        IF NOT enum_has_dealer THEN
            -- Add 'dealer' to the enum
            ALTER TYPE user_role ADD VALUE 'dealer';
            RAISE NOTICE 'Added dealer to user_role enum';
        ELSE
            RAISE NOTICE 'dealer already exists in user_role enum';
        END IF;
    ELSE
        RAISE NOTICE 'user_role enum does not exist, no action taken';
    END IF;
END
$$;

-- Create a function to safely update a user's role to dealer
CREATE OR REPLACE FUNCTION set_user_as_dealer(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update user_type field which is TEXT
    UPDATE profiles
    SET user_type = 'dealer'
    WHERE id = user_id;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User type set to dealer'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error setting user as dealer: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
