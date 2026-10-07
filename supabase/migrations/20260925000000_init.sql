-- Gladstone Uncovered — availability + Google Calendar sync
-- Apply in Supabase SQL editor or via: supabase db push

create extension if not exists "pgcrypto";

-- People (Dylan, Haydn)
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  email text,
  created_at timestamptz not null default now()
);

-- Shift → free slots / inquire
create table if not exists public.shift_rules (
  code text primary key,
  free_slots text[] not null default '{}',
  inquire boolean not null default false
);

-- Roster rows
create table if not exists public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  person_id uuid not null references public.people(id) on delete cascade,
  shift_code text not null,
  unique (work_date, person_id)
);

create index if not exists roster_entries_date_idx on public.roster_entries (work_date);

-- Bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  slot text not null check (slot in ('morning', 'afternoon', 'night', '')),
  service text,
  service_label text,
  client_name text,
  client_email text,
  client_phone text,
  organisation text,
  location text,
  details text,
  crew_mode text not null default 'one' check (crew_mode in ('one', 'both')),
  assignee_person_id uuid references public.people(id),
  gcal_event_id text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'hold')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_date_idx on public.bookings (work_date);

-- Google Calendar connections (tokens never exposed to anon client)
create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references public.people(id) on delete cascade,
  google_refresh_token text not null,
  calendar_id text not null default 'primary',
  google_email text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Manual overrides
create table if not exists public.overrides (
  id uuid primary key default gen_random_uuid(),
  work_date date not null unique,
  state text not null check (state in ('available', 'limited', 'unavailable', 'inquire')),
  note text,
  created_at timestamptz not null default now()
);

-- Cached free/busy (optional; engine can also query live)
create table if not exists public.busy_cache (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  synced_at timestamptz not null default now()
);

create index if not exists busy_cache_person_range_idx
  on public.busy_cache (person_id, starts_at, ends_at);

-- App settings (both-required services, etc.)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'
);

-- RLS: lock down tables; Edge Functions use service role
alter table public.people enable row level security;
alter table public.shift_rules enable row level security;
alter table public.roster_entries enable row level security;
alter table public.bookings enable row level security;
alter table public.calendar_connections enable row level security;
alter table public.overrides enable row level security;
alter table public.busy_cache enable row level security;
alter table public.app_settings enable row level security;

-- Public read of non-sensitive reference data (optional; API preferred)
create policy "Public read people" on public.people for select using (true);
create policy "Public read shift_rules" on public.shift_rules for select using (true);
create policy "Public read roster" on public.roster_entries for select using (true);
create policy "Public read overrides" on public.overrides for select using (true);
create policy "Public read settings" on public.app_settings for select using (true);
-- bookings: no public select of client PII — only via Edge Function
-- calendar_connections: no public access
