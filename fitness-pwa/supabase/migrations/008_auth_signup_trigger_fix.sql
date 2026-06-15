-- Phase 8: Harden Supabase Auth signup triggers.
--
-- Run this in Supabase SQL Editor if signup returns 500 from /auth/v1/signup
-- while login works. This patch keeps the same security model:
-- - public.allowed_users controls who may create an account.
-- - public.profiles is created automatically for approved auth.users rows.
-- - RLS stays enabled.
--
-- Expected signup flow:
-- 1. require_allowed_user_email runs before auth.users insert.
-- 2. Supabase creates auth.users row.
-- 3. create_profile_for_new_user runs after auth.users insert.
-- 4. public.profiles contains one row keyed by auth.users.id.

create extension if not exists pgcrypto;

-- Ensure the auth foundation tables/columns exist even if earlier SQL was
-- applied partially or out of order.
create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz not null default now(),
  note text
);

alter table public.allowed_users
  drop constraint if exists allowed_users_email_lowercase;

update public.allowed_users as allowed_user
set email = lower(trim(allowed_user.email))
where allowed_user.email <> lower(trim(allowed_user.email))
  and not exists (
    select 1
    from public.allowed_users as existing_allowed_user
    where existing_allowed_user.email = lower(trim(allowed_user.email))
  );

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

-- Backfill email before enforcing not null. This should be a no-op for healthy
-- installs, but repairs profiles created manually without email.
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

-- Keep allowed_users admin-managed. The trigger runs as security definer so it
-- can read the allowlist even though clients cannot.
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

drop trigger if exists require_allowed_user_email on auth.users;

create trigger require_allowed_user_email
before insert on auth.users
for each row
execute function public.require_allowed_user_email();

-- Idempotent profile creation. ON CONFLICT prevents signup from failing if a
-- profile row was pre-created manually during troubleshooting.
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

drop trigger if exists create_profile_for_new_user on auth.users;

create trigger create_profile_for_new_user
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();

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
-- Diagnostics to run manually in Supabase SQL Editor.
-- Replace the email below before running.
-- ---------------------------------------------------------------------------

-- 1. Check allowlist casing/existence:
-- select email, email = lower(trim(email)) as is_normalized, created_at, note
-- from public.allowed_users
-- where email = lower(trim('athlete@example.com'));

-- 2. Check whether an auth user and profile exist:
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

-- 3. Check trigger wiring:
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
--   and trigger_name in (
--     'require_allowed_user_email',
--     'create_profile_for_new_user'
--   )
-- order by trigger_name;

-- 4. Check function definitions:
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
