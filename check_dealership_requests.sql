-- Check dealership requests in the database

-- Count all requests by status
SELECT 
    status, 
    COUNT(*) 
FROM 
    dealership_requests 
GROUP BY 
    status;

-- Show all requests with user info
SELECT 
    dr.id,
    dr.user_id,
    dr.business_name,
    dr.status,
    dr.created_at,
    p.email,
    p.full_name,
    p.role
FROM 
    dealership_requests dr
LEFT JOIN 
    profiles p ON dr.user_id = p.id
ORDER BY 
    dr.created_at DESC;

-- Check RLS policies on dealership_requests
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'dealership_requests';

-- Check if current user is admin
SELECT 
    id, 
    email, 
    role 
FROM 
    profiles 
WHERE 
    id = auth.uid();

-- Show all users with role = 'admin'
SELECT 
    id, 
    email, 
    role 
FROM 
    profiles 
WHERE 
    role = 'admin';
