-- Add Arabic name columns to brands table
ALTER TABLE public.brands
ADD COLUMN name_ar character varying(100);

-- Add Arabic name columns to models table
ALTER TABLE public.models
ADD COLUMN name_ar character varying(100);

-- Create RLS policies for brands table
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Everyone can view brands
CREATE POLICY "Everyone can view brands" 
ON public.brands 
FOR SELECT 
USING (true);

-- Only admins can insert/update/delete brands
CREATE POLICY "Only admins can insert brands" 
ON public.brands 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update brands" 
ON public.brands 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete brands" 
ON public.brands 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Create RLS policies for models table
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- Everyone can view models
CREATE POLICY "Everyone can view models" 
ON public.models 
FOR SELECT 
USING (true);

-- Only admins can insert/update/delete models
CREATE POLICY "Only admins can insert models" 
ON public.models 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update models" 
ON public.models 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete models" 
ON public.models 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');
