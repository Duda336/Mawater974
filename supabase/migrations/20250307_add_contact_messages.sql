-- Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    country_id INTEGER REFERENCES public.countries(id),
    status TEXT NOT NULL DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting messages (anyone can create a message)
CREATE POLICY "Anyone can create a contact message" 
ON public.contact_messages FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy for viewing messages (only admins can view all messages)
CREATE POLICY "Admins can view all contact messages" 
ON public.contact_messages FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create policy for users to view their own messages
CREATE POLICY "Users can view their own contact messages" 
ON public.contact_messages FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Create policy for updating messages (only admins can update)
CREATE POLICY "Admins can update contact messages" 
ON public.contact_messages FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create policy for deleting messages (only admins can delete)
CREATE POLICY "Admins can delete contact messages" 
ON public.contact_messages FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Add the table to the public schema
GRANT ALL ON public.contact_messages TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE public.contact_messages_id_seq TO postgres, anon, authenticated, service_role;
