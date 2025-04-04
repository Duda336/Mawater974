-- Create currency_rates table
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(20, 10) NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Add RLS policies for currency_rates
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read currency rates
CREATE POLICY "Anyone can read currency rates" 
  ON public.currency_rates 
  FOR SELECT 
  USING (true);

-- Only allow admins to modify currency rates
CREATE POLICY "Only admins can insert currency rates" 
  ON public.currency_rates 
  FOR INSERT 
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can update currency rates" 
  ON public.currency_rates 
  FOR UPDATE 
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete currency rates" 
  ON public.currency_rates 
  FOR DELETE 
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Insert initial exchange rates (as of March 2025)
-- Base rates against USD
INSERT INTO public.currency_rates (from_currency, to_currency, rate) VALUES
  ('USD', 'QAR', 3.64), -- 1 USD = 3.64 Qatari Riyal
  ('USD', 'SAR', 3.75), -- 1 USD = 3.75 Saudi Riyal
  ('USD', 'AED', 3.67), -- 1 USD = 3.67 UAE Dirham
  ('USD', 'KWD', 0.31), -- 1 USD = 0.31 Kuwaiti Dinar
  ('USD', 'SYP', 2512.53), -- 1 USD = 2512.53 Syrian Pound
  
  -- Reverse rates
  ('QAR', 'USD', 0.275), -- 1 QAR = 0.275 USD
  ('SAR', 'USD', 0.267), -- 1 SAR = 0.267 USD
  ('AED', 'USD', 0.272), -- 1 AED = 0.272 USD
  ('KWD', 'USD', 3.25), -- 1 KWD = 3.25 USD
  ('SYP', 'USD', 0.000398) -- 1 SYP = 0.000398 USD
ON CONFLICT (from_currency, to_currency) DO UPDATE 
SET rate = EXCLUDED.rate, updated_at = NOW();

-- Create a function to convert prices between currencies
CREATE OR REPLACE FUNCTION public.convert_price(
  price DECIMAL,
  from_currency VARCHAR,
  to_currency VARCHAR
) RETURNS DECIMAL AS $$
DECLARE
  conversion_rate DECIMAL;
BEGIN
  -- If currencies are the same, return original price
  IF from_currency = to_currency THEN
    RETURN price;
  END IF;
  
  -- Try to find direct conversion rate
  SELECT rate INTO conversion_rate
  FROM public.currency_rates
  WHERE from_currency = $2 AND to_currency = $3;
  
  IF conversion_rate IS NOT NULL THEN
    RETURN price * conversion_rate;
  END IF;
  
  -- Try to find reverse conversion rate
  SELECT 1/rate INTO conversion_rate
  FROM public.currency_rates
  WHERE from_currency = $3 AND to_currency = $2;
  
  IF conversion_rate IS NOT NULL THEN
    RETURN price * conversion_rate;
  END IF;
  
  -- Try to convert through USD
  DECLARE
    to_usd DECIMAL;
    from_usd DECIMAL;
  BEGIN
    SELECT rate INTO to_usd
    FROM public.currency_rates
    WHERE from_currency = $2 AND to_currency = 'USD';
    
    SELECT rate INTO from_usd
    FROM public.currency_rates
    WHERE from_currency = 'USD' AND to_currency = $3;
    
    IF to_usd IS NOT NULL AND from_usd IS NOT NULL THEN
      RETURN price * to_usd * from_usd;
    END IF;
  END;
  
  -- If no conversion found, return original price
  RETURN price;
END;
$$ LANGUAGE plpgsql;

-- Create a function to filter cars by country
CREATE OR REPLACE FUNCTION public.filter_cars_by_country(country_id INTEGER)
RETURNS SETOF public.cars AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.cars
  WHERE country_id = $1 OR country_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_currency_rates_timestamp
BEFORE UPDATE ON public.currency_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();
