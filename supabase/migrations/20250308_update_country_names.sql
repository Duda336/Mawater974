-- Update country names for Saudi Arabia and UAE
UPDATE public.countries
SET name_ar = 'السعودية'
WHERE code = 'SA';

UPDATE public.countries
SET name = 'UAE', name_ar = 'الإمارات'
WHERE code = 'AE';
