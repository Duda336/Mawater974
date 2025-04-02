-- Create website_settings table
create table public.website_settings (
  id bigint generated by default as identity not null,
  key text not null,
  value text not null,
  value_ar text null,
  description text null,
  category text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint website_settings_pkey primary key (id),
  constraint website_settings_key_key unique (key)
);

-- Add RLS policies
alter table public.website_settings enable row level security;

create policy "Allow public read access to website_settings"
  on public.website_settings for select
  to authenticated, anon
  using (true);

create policy "Allow admins to update website_settings"
  on public.website_settings for update
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Allow admins to insert website_settings"
  on public.website_settings for insert
  to authenticated
  with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Allow admins to delete website_settings"
  on public.website_settings for delete
  to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Add trigger for updated_at
create trigger update_website_settings_timestamp
before update on public.website_settings
for each row execute function update_timestamp();
