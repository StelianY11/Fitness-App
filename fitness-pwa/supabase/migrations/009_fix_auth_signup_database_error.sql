-- Phase 8: Fix "Database error saving new user" during Supabase signup.
--
-- Run this in Supabase SQL Editor when /auth/v1/signup returns:
-- AuthApiError 500 unexpected_failure "Database error saving new user"
--
-- This patch keeps the security model intact:
-- - Signups are allowed only when the lowercase email exists in public.allowed_users.
-- - A public.profiles row is created automatically for each approved auth user.
-- - RLS remains enabled on public tables.
--
-- Why this exists:
-- Supabase Auth returns a generic 500 when any auth.users trigger fails. The
-- common causes are stale duplicate signup triggers, a non-idempotent profile
-- insert, allowlist casing mismatch, or a profile schema applied out of order.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Foundation tables and columns
-- ---------------------------------------------------------------------------

create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz not null default now(),
  note text
);

-- Normalize allowlist email casing before re-adding the check constraint.
-- If duplicate rows exist after lowercasing, resolve those manually first.
update public.allowed_users as allowed_user
set email = lower(trim(allowed_user.email))
where allowed_user.email <> lower(trim(allowed_user.email))
  and not exists (
    select 1
    from public.allowed_users as existing_allowed_user
    where existing_allowed_user.email = lower(trim(allowed_user.email))
  );

alter table public.allowed_users
  drop constraint if exists allowed_users_email_lowercase;

alter table public.allowed_users
  add constraint allowed_users_email_lowercase
  check (email = lower(trim(email)));

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists pre_fill_mode text not null default 'LAST_WORKOUT';

alter table public.profiles
  drop constraint if exists profiles_pre_fill_mode_check;

alter table public.profiles
  add constraint profiles_pre_fill_mode_check
  check (pre_fill_mode in ('LAST_WORKOUT', 'TEMPLATE', 'EMPTY'));

update public.profiles as profile
set email = lower(trim(auth_user.email))
from auth.users as auth_user
where profile.id = auth_user.id
  and (
    profile.email is null
    or profile.email <> lower(trim(auth_user.email))
  );

create index if not exists profiles_email_idx
on public.profiles (email);

alter table public.allowed_users enable row level security;
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Shared updated_at helper
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Remove common stale/duplicate auth profile triggers.
-- ---------------------------------------------------------------------------
-- A duplicate old trigger such as "on_auth_user_created" can still run and
-- fail even if create_profile_for_new_user is correct.

drop trigger if exists require_allowed_user_email on auth.users;
drop trigger if exists create_profile_for_new_user on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists handle_new_user_trigger on auth.users;

-- ---------------------------------------------------------------------------
-- Canonical allowlist trigger
-- ---------------------------------------------------------------------------

create or replace function public.require_allowed_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  normalized_email := lower(trim(new.email));

  if normalized_email is null or normalized_email = '' then
    raise exception 'Email is required for this application.';
  end if;

  if not exists (
    select 1
    from public.allowed_users
    where email = normalized_email
  ) then
    raise exception 'Email is not allowlisted for this application.';
  end if;

  return new;
end;
$$;

create trigger require_allowed_user_email
before insert on auth.users
for each row
execute function public.require_allowed_user_email();

-- ---------------------------------------------------------------------------
-- Canonical profile creation trigger
-- ---------------------------------------------------------------------------
-- Insert only app-owned required/defaulted fields. ON CONFLICT prevents signup
-- from failing when a profile was manually created during troubleshooting.

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  normalized_email := lower(trim(new.email));

  insert into public.profiles (
    id,
    email,
    display_name,
    avatar_url,
    pre_fill_mode
  )
  values (
    new.id,
    normalized_email,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    'LAST_WORKOUT'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    pre_fill_mode = coalesce(public.profiles.pre_fill_mode, excluded.pre_fill_mode),
    updated_at = now();

  return new;
end;
$$;

create trigger create_profile_for_new_user
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();

-- ---------------------------------------------------------------------------
-- Profile RLS policies
-- ---------------------------------------------------------------------------

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Diagnostics to run manually after applying.
-- Replace athlete@example.com with the test email.
-- ---------------------------------------------------------------------------

-- 1. List all triggers attached to auth.users:
-- select
--   event_object_schema,
--   event_object_table,
--   trigger_name,
--   action_timing,
--   event_manipulation,
--   action_statement
-- from information_schema.triggers
-- where event_object_schema = 'auth'
--   and event_object_table = 'users'
-- order by trigger_name;

-- 2. List profile columns, nullability, defaults:
-- select
--   column_name,
--   data_type,
--   is_nullable,
--   column_default
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'profiles'
-- order by ordinal_position;

-- 3. List profile constraints:
-- select
--   conname as constraint_name,
--   contype as constraint_type,
--   pg_get_constraintdef(oid) as definition
-- from pg_constraint
-- where conrelid = 'public.profiles'::regclass
-- order by conname;

-- 4. Check whether the test email is allowlisted:
-- select
--   email,
--   email = lower(trim(email)) as is_normalized,
--   created_at,
--   note
-- from public.allowed_users
-- where email = lower(trim('athlete@example.com'));

-- 5. Check auth user/profile state for a test email:
-- select
--   auth_user.id,
--   auth_user.email as auth_email,
--   auth_user.created_at as auth_created_at,
--   profile.id is not null as has_profile,
--   profile.email as profile_email,
--   profile.pre_fill_mode
-- from auth.users as auth_user
-- left join public.profiles as profile on profile.id = auth_user.id
-- where lower(auth_user.email) = lower(trim('athlete@example.com'));

-- 6. Check canonical function definitions:
-- select
--   n.nspname as schema_name,
--   p.proname as function_name,
--   pg_get_functiondef(p.oid) as definition
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in (
--     'require_allowed_user_email',
--     'create_profile_for_new_user'
--   );
