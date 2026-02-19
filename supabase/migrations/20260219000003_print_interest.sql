create table if not exists public.print_interest (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  book_id uuid references public.books(id) on delete set null,
  email text,
  created_at timestamptz default now() not null,
  unique(user_id, book_id)
);
alter table public.print_interest enable row level security;
-- Only service role can read/write (via API route)
create policy "Service role only" on public.print_interest for all using (false);
