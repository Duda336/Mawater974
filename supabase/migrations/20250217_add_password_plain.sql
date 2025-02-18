-- Add plain text password column to profiles table
ALTER TABLE public.profiles
ADD COLUMN password_plain VARCHAR(255);

-- Note: This is for educational purposes only. 
-- Never store passwords in plain text in a production environment!
