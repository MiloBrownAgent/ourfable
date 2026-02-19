-- Waitlist table for early access email collection
create table public.waitlist (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  source text default 'landing',
  created_at timestamptz default now() not null
);

alter table public.waitlist enable row level security;

-- Allow inserts from anon (public signups)
create policy "Anyone can join waitlist" on public.waitlist for insert with check (true);
