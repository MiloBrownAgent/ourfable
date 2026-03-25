-- OurFable Question Engine Schema
-- Migration: 2026-03-25
-- Adds: family_contributors, question_campaigns, question_responses

-- ============================================================
-- family_contributors
-- Parents add the people who will answer questions each month
-- ============================================================
create type public.contributor_role as enum (
  'grandparent',
  'godparent',
  'uncle',
  'aunt',
  'old_friend',
  'neighbor',
  'mentor',
  'family_friend'
);

create table public.family_contributors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  email text not null,
  relationship_role public.contributor_role not null,
  child_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.family_contributors enable row level security;

create policy "Owners can view own contributors"
  on public.family_contributors for select
  using (auth.uid() = owner_id);

create policy "Owners can insert own contributors"
  on public.family_contributors for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update own contributors"
  on public.family_contributors for update
  using (auth.uid() = owner_id);

create policy "Owners can delete own contributors"
  on public.family_contributors for delete
  using (auth.uid() = owner_id);

create index family_contributors_owner_id_idx on public.family_contributors (owner_id);
create index family_contributors_active_idx on public.family_contributors (active);

-- ============================================================
-- question_campaigns
-- One per contributor per month. Tracks the question + delivery status.
-- ============================================================
create type public.campaign_status as enum (
  'pending',
  'sent',
  'responded',
  'expired'
);

create table public.question_campaigns (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid references public.family_contributors(id) on delete cascade not null,
  question_text text not null,
  question_month text not null, -- format: "2026-03"
  status public.campaign_status not null default 'pending',
  email_sent_at timestamptz,
  response_token text unique not null default gen_random_uuid()::text,
  created_at timestamptz not null default now(),

  -- one campaign per contributor per month
  unique (contributor_id, question_month)
);

alter table public.question_campaigns enable row level security;

-- Owners can read campaigns for their contributors
create policy "Owners can view own campaigns"
  on public.question_campaigns for select
  using (
    exists (
      select 1 from public.family_contributors fc
      where fc.id = contributor_id
        and fc.owner_id = auth.uid()
    )
  );

create index question_campaigns_contributor_id_idx on public.question_campaigns (contributor_id);
create index question_campaigns_status_idx on public.question_campaigns (status);
create index question_campaigns_response_token_idx on public.question_campaigns (response_token);

-- ============================================================
-- question_responses
-- Stores contributor answers. One per campaign.
-- ============================================================
create table public.question_responses (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid unique references public.question_campaigns(id) on delete cascade not null,
  contributor_id uuid references public.family_contributors(id) on delete cascade not null,
  response_text text not null,
  responded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.question_responses enable row level security;

-- Owners can read responses for their contributors
create policy "Owners can view own responses"
  on public.question_responses for select
  using (
    exists (
      select 1 from public.family_contributors fc
      where fc.id = contributor_id
        and fc.owner_id = auth.uid()
    )
  );

create index question_responses_campaign_id_idx on public.question_responses (campaign_id);
create index question_responses_contributor_id_idx on public.question_responses (contributor_id);
