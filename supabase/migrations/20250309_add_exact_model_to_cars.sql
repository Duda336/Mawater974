-- Add exact_model field to cars table
ALTER TABLE public.cars
ADD COLUMN exact_model VARCHAR(100) NULL;

-- Add comment to explain the purpose of the field
COMMENT ON COLUMN public.cars.exact_model IS 'Optional text field for specifying an exact model name that might not be in the models table';
