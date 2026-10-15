-- Signal: persistent accounts and per-user favorites.
-- Run once in the Supabase dashboard → SQL Editor → New query → Run.
-- Safe to re-run (idempotent).

-- Accounts used by the app's own auth (scrypt hashes; never plaintext).
create table if not exists public.app_users (
  id            text primary key default gen_random_uuid()::text,
  email         text not null unique check (email = lower(email)),
  name          text not null check (char_length(name) between 1 and 60),
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- One row per (user, item): every registered user has their own favorites.
create table if not exists public.user_favorites (
  user_id    text not null references public.app_users(id) on delete cascade,
  item_id    text not null check (char_length(item_id) <= 300),
  item       jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists user_favorites_user_created_idx
  on public.user_favorites (user_id, created_at desc);

-- Lock both tables down: RLS on, and NO policies. The browser never talks to
-- Supabase; only the Next.js server does, with the secret key (which bypasses
-- RLS). Publishable/anon keys therefore get nothing.
alter table public.app_users enable row level security;
alter table public.user_favorites enable row level security;
revoke all on public.app_users from anon, authenticated;
revoke all on public.user_favorites from anon, authenticated;
