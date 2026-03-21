-- =========================
-- BOOKMARKS
-- =========================
create table public.bookmarks (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  url text not null,
  title text not null,
  annotation text not null default ''::text,
  folder text null,
  favorite boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint bookmarks_pkey primary key (id),
  constraint bookmarks_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

-- =========================
-- EVENTS
-- =========================
create table public.events (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text null default ''::text,
  created_at timestamp with time zone not null default now(),
  start_date date null,
  end_date date null,
  color text null default '#22c55e'::text,
  completed boolean null default false,
  tags text[] null default '{}'::text[],
  xp_awarded boolean null default false,
  constraint events_pkey primary key (id),
  constraint events_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

-- =========================
-- FEEDBACK
-- =========================
create table public.feedback (
  id uuid not null default gen_random_uuid(),
  user_id uuid null,
  type text not null,
  message text not null,
  created_at timestamp with time zone null default now(),
  constraint feedback_pkey primary key (id),
  constraint feedback_user_id_fkey foreign key (user_id)
    references profiles (id) on delete set null
) tablespace pg_default;

-- =========================
-- LAYOUTS
-- =========================
create table public.layouts (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  layout_data jsonb not null default '[]'::jsonb,
  widgets jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone not null default now(),
  saved_layouts jsonb not null default '[]'::jsonb,
  active_layout_id text null,
  task_order jsonb not null default '[]'::jsonb,
  constraint layouts_pkey primary key (id),
  constraint layouts_user_id_key unique (user_id),
  constraint layouts_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

-- =========================
-- MILESTONES
-- =========================
create table public.milestones (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  date date not null,
  description text null default ''::text,
  created_at timestamp with time zone not null default now(),
  constraint milestones_pkey primary key (id),
  constraint milestones_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

-- =========================
-- NOTES
-- =========================
create table public.notes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null default ''::text,
  content text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  tags text[] null default '{}'::text[],
  constraint notes_pkey primary key (id),
  constraint notes_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

-- =========================
-- PROFILES
-- =========================
create table public.profiles (
  id uuid not null,
  username text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  gamification jsonb null default '{}'::jsonb,
  constraint profiles_pkey primary key (id),
  constraint profiles_username_key unique (username),
  constraint profiles_id_fkey foreign key (id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

-- =========================
-- USER TAGS
-- =========================
create table public.user_tags (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  created_at timestamp with time zone null default now(),
  color text null default '#22c55e'::text,
  constraint user_tags_pkey primary key (id),
  constraint user_tags_user_id_name_key unique (user_id, name),
  constraint user_tags_user_id_fkey foreign key (user_id)
    references auth.users (id) on delete cascade
) tablespace pg_default;

create index if not exists user_tags_user_id_idx
  on public.user_tags using btree (user_id)
  tablespace pg_default;

-- =========================
-- FUNCTIONS
-- =========================

-- Leaderboard RPC: sorts and limits inside Postgres so the client never
-- receives a full table dump. Run with SECURITY DEFINER so RLS is bypassed
-- for this read-only, non-sensitive aggregation.
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_limit int DEFAULT 50)
RETURNS TABLE(id uuid, username text, xp int)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT id, username, (gamification->>'xp')::int AS xp
  FROM profiles
  WHERE gamification IS NOT NULL
    AND username IS NOT NULL
    AND (gamification->>'xp')::int > 0
  ORDER BY (gamification->>'xp')::int DESC
  LIMIT p_limit;
$$;

-- =========================
-- ROW LEVEL SECURITY
-- =========================
-- Run these in the Supabase SQL editor if RLS is not yet enabled on these tables.
-- The tables created above should also have matching policies in the dashboard.

-- bookmarks
alter table public.bookmarks enable row level security;
create policy "Users can CRUD own bookmarks" on public.bookmarks
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_tags
alter table public.user_tags enable row level security;
create policy "Users can CRUD own tags" on public.user_tags
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- feedback (insert: any authenticated user; select/delete: admin only via RLS or Edge Function)
alter table public.feedback enable row level security;
create policy "Authenticated users can submit feedback" on public.feedback
  for insert
  with check (auth.uid() = user_id or user_id is null);
create policy "Users can read own feedback" on public.feedback
  for select
  using (auth.uid() = user_id);

-- events
alter table public.events enable row level security;
create policy "Users can CRUD own events" on public.events
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- layouts
alter table public.layouts enable row level security;
create policy "Users can CRUD own layouts" on public.layouts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- milestones
alter table public.milestones enable row level security;
create policy "Users can CRUD own milestones" on public.milestones
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- notes
alter table public.notes enable row level security;
create policy "Users can CRUD own notes" on public.notes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- profiles (id IS the auth.uid — no separate user_id column)
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);