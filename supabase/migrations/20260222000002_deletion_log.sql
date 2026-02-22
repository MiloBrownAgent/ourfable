-- Deletion log table — COPPA P0 compliance audit trail
-- Tracks all data deletions: who, what, when, why, initiated by

create table public.deletion_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,                      -- may be null if user was already deleted
  resource_type text not null,       -- 'character_photo', 'book_asset', 'book', 'account', 'consent_record'
  resource_id text,                  -- storage path or DB row ID
  deleted_at timestamptz not null default now(),
  reason text not null,              -- 'user_request', 'abandoned_upload', 'post_delivery_retention', 'annual_cleanup', 'account_deletion'
  initiated_by text not null         -- 'user', 'system', 'admin'
);

-- No RLS — this is an internal audit table only
-- Only service role can insert; users cannot see or modify

create index deletion_log_user_id_idx on public.deletion_log (user_id);
create index deletion_log_deleted_at_idx on public.deletion_log (deleted_at);
create index deletion_log_reason_idx on public.deletion_log (reason);
