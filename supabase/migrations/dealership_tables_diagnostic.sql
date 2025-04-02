-- Diagnostic script to check and fix dealership tables

-- Check tables existence
SELECT 
    table_name 
FROM 
    information_schema.tables 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('dealership_requests', 'dealership_registrations', 'dealership_profiles');

-- Check dealership_requests structure
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'dealership_requests';

-- Check dealership_profiles structure
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'dealership_profiles';

-- Check if approve_dealership_request function exists
SELECT 
    proname, 
    proargtypes::regtype[] as arg_types
FROM 
    pg_proc 
WHERE 
    proname = 'approve_dealership_request';

-- Check if reject_dealership_request function exists
SELECT 
    proname, 
    proargtypes::regtype[] as arg_types
FROM 
    pg_proc 
WHERE 
    proname = 'reject_dealership_request';

-- Count pending dealership requests
SELECT 
    status, 
    COUNT(*) 
FROM 
    dealership_requests 
GROUP BY 
    status;

-- Check if any profiles have user_type = 'dealer'
SELECT 
    COUNT(*) 
FROM 
    profiles 
WHERE 
    role = 'dealer' 
    OR user_type = 'dealer';
