-- COPPA Parental Consent Records
-- Required before public launch per implementation-checklist.md (P0)
-- Tracks: what was consented to, when, which policy version, from where

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  consent_type text not null,       -- 'photo_collection_and_ai_processing'
  consent_version text not null,    -- e.g. '2026-02-19'  (date of privacy policy)
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,           -- null = still active
  ip_address inet,
  user_agent text,
  metadata jsonb                    -- reserved for future fields
);

alter table public.consent_records enable row level security;

-- Users can view their own consent records
create policy "Users view own consent" on public.consent_records
  for select using (auth.uid() = user_id);

-- Users can insert consent records for themselves
create policy "Users insert own consent" on public.consent_records
  for insert with check (auth.uid() = user_id);

-- Users can update (revoke) their own consent records
create policy "Users update own consent" on public.consent_records
  for update using (auth.uid() = user_id);

-- Index for fast lookups by user
create index consent_records_user_id_idx on public.consent_records (user_id);
create index consent_records_type_idx on public.consent_records (user_id, consent_type, revoked_at);
