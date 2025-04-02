-- Analysis of dealership_registrations table

-- Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'dealership_registrations'
);

-- Get table structure if it exists
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'dealership_registrations'
ORDER BY 
    ordinal_position;

-- Count records in the table
SELECT 
    status, 
    COUNT(*) 
FROM 
    dealership_registrations 
GROUP BY 
    status;

-- Check if there are any approved registrations that have dealership profiles
SELECT 
    dr.id,
    dr.status,
    dp.id as dealership_profile_id
FROM 
    dealership_registrations dr
LEFT JOIN 
    dealership_profiles dp ON dp.registration_id = dr.id
WHERE 
    dr.status = 'approved';

-- Check for foreign key references to dealership_registrations
SELECT
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'dealership_registrations';

-- Check for references in dealership_profiles
SELECT COUNT(*) 
FROM dealership_profiles 
WHERE registration_id IS NOT NULL;

-- Compare data between dealership_registrations and dealership_requests
-- Check if there are users who have both
SELECT 
    dr.user_id,
    COUNT(dreg.id) as registration_count,
    COUNT(dreq.id) as request_count
FROM 
    profiles dr
LEFT JOIN 
    dealership_registrations dreg ON dreg.email = (SELECT email FROM auth.users WHERE id = dr.id)
LEFT JOIN 
    dealership_requests dreq ON dreq.user_id = dr.id
GROUP BY 
    dr.user_id
HAVING 
    COUNT(dreg.id) > 0 OR COUNT(dreq.id) > 0;
