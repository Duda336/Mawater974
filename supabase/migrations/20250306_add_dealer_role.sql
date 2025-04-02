-- This migration adds 'dealer' to the user_role enum type

-- Add 'dealer' to the user_role enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'dealer';
