-- OurFable.ai Database Schema
-- Run in: Supabase Dashboard → SQL Editor

-- Profiles (auto-created on signup)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Books
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  character_name text not null,
  character_age int,
  character_photo_url text,
  story_prompt text not null,
  included_elements text[] default '{}',
  art_style text not null default 'watercolor'
    check (art_style in ('watercolor', 'whimsical', 'soft_pastel', 'bold_pop', 'fantasy', 'classic')),
  status text not null default 'draft'
    check (status in ('draft', 'generating', 'ready', 'failed')),
  pages jsonb,
  cover_image_url text,
  pdf_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.books enable row level security;
create policy "Users can view own books" on public.books for select using (auth.uid() = user_id);
create policy "Users can insert own books" on public.books for insert with check (auth.uid() = user_id);
create policy "Users can update own books" on public.books for update using (auth.uid() = user_id);
create policy "Users can delete own books" on public.books for delete using (auth.uid() = user_id);

-- Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete set null,
  format text not null check (format in ('digital', 'hardcover')),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'refunded')),
  amount_cents int not null,
  stripe_payment_intent_id text,
  shipping_address jsonb,
  tracking_number text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.orders enable row level security;
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);

-- Auto-update timestamps
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at();
create trigger update_books_updated_at before update on public.books for each row execute function public.update_updated_at();
create trigger update_orders_updated_at before update on public.orders for each row execute function public.update_updated_at();

-- Storage Buckets
insert into storage.buckets (id, name, public) values ('character-photos', 'character-photos', false);
create policy "Users can upload character photos" on storage.objects for insert
  with check (bucket_id = 'character-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view own character photos" on storage.objects for select
  using (bucket_id = 'character-photos' and auth.uid()::text = (storage.foldername(name))[1]);

insert into storage.buckets (id, name, public) values ('book-assets', 'book-assets', true);
create policy "Anyone can view book assets" on storage.objects for select using (bucket_id = 'book-assets');

-- ============================================================
-- Consent Records (added 2026-02-22 — COPPA P0)
-- ============================================================
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  consent_type text not null,
  consent_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  metadata jsonb
);
alter table public.consent_records enable row level security;
create policy "Users view own consent" on public.consent_records for select using (auth.uid() = user_id);
create policy "Users insert own consent" on public.consent_records for insert with check (auth.uid() = user_id);
create policy "Users update own consent" on public.consent_records for update using (auth.uid() = user_id);
create index consent_records_user_id_idx on public.consent_records (user_id);
create index consent_records_type_idx on public.consent_records (user_id, consent_type, revoked_at);
