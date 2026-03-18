-- FlowDesk Supabase Schema
-- Run this in the Supabase SQL Editor

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Notes table
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  content text not null default '',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.notes enable row level security;

create policy "Users can manage their own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Events table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  start_date date not null,
  end_date date,
  color text default '#22c55e',
  description text default '',
  created_at timestamptz default now() not null
);

alter table public.events enable row level security;

create policy "Users can manage their own events"
  on public.events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Layouts table
create table if not exists public.layouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  layout_data jsonb not null default '[]'::jsonb,
  widgets jsonb not null default '[]'::jsonb,
  saved_layouts jsonb not null default '[]'::jsonb,
  task_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now() not null
);

alter table public.layouts enable row level security;

create policy "Users can manage their own layout"
  on public.layouts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Milestones table
create table if not exists public.milestones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  date date not null,
  description text default '',
  created_at timestamptz default now() not null
);

alter table public.milestones enable row level security;

create policy "Users can manage their own milestones"
  on public.milestones for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Migrations (run once on existing databases):
-- alter table public.layouts add column if not exists saved_layouts jsonb not null default '[]'::jsonb;
-- alter table public.layouts add column if not exists active_layout_id text;
-- alter table public.layouts add column if not exists task_order jsonb not null default '[]'::jsonb;
