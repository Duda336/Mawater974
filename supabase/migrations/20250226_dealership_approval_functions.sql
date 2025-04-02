-- Functions to handle dealership request approvals
-- This migration creates functions to approve or reject dealership requests from the new dealership_requests table

-- Function to approve a dealership request
CREATE OR REPLACE FUNCTION approve_dealership_request(request_id BIGINT, reviewer_id UUID, notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    result JSONB;
BEGIN
    -- Get the user_id from the request and update it
    UPDATE dealership_requests
    SET status = 'approved',
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending'
    RETURNING user_id INTO v_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Request not found or not pending'
        );
    END IF;

    -- Update user profile role to dealer using the safe function
    PERFORM set_user_as_dealer(v_user_id);

    -- Create dealership profile if it doesn't exist
    INSERT INTO dealership_profiles (
        user_id,
        business_name,
        business_name_ar,
        description,
        description_ar,
        logo_url,
        location,
        dealership_type,
        business_type,
        brands,
        is_verified
    ) 
    SELECT 
        user_id,
        business_name,
        business_name_ar,
        description,
        description_ar,
        logo_url,
        location,
        dealership_type,
        business_type,
        brands,
        true
    FROM dealership_requests
    WHERE id = request_id
    ON CONFLICT (user_id) 
    DO UPDATE SET
        business_name = EXCLUDED.business_name,
        business_name_ar = EXCLUDED.business_name_ar,
        description = EXCLUDED.description,
        description_ar = EXCLUDED.description_ar,
        logo_url = EXCLUDED.logo_url,
        location = EXCLUDED.location,
        dealership_type = EXCLUDED.dealership_type,
        business_type = EXCLUDED.business_type,
        brands = EXCLUDED.brands,
        is_verified = true,
        updated_at = NOW();

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Dealership request approved successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error approving dealership request: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a dealership request
CREATE OR REPLACE FUNCTION reject_dealership_request(request_id BIGINT, reviewer_id UUID, notes TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update the request status
    UPDATE dealership_requests
    SET status = 'rejected',
        updated_at = NOW()
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Request not found or not pending'
        );
    END IF;

    -- Return success
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Dealership request rejected successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Error rejecting dealership request: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
