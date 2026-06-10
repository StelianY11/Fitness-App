-- Fitness Tracker auth foundation
--
-- Run this manually in the Supabase SQL Editor after reviewing it for your project.
-- This file is not applied automatically by the Angular app.
--
-- Allowlist model:
-- 1. Add approved emails to public.allowed_users before inviting/registering users.
-- 2. The auth.users BEFORE INSERT trigger rejects signups for emails that are not allowlisted.
-- 3. Profiles are created automatically after an approved auth user is inserted.

create extension if not exists pgcrypto;

create table if not exists public.allowed_users (
  email text primary key,
  created_at timestamptz not null default now(),
  note text,
  constraint allowed_users_email_lowercase check (email = lower(email))
);

comment on table public.allowed_users is
  'Emails allowed to create accounts. Manage this table from the Supabase dashboard, SQL Editor, or service-role backend only.';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.allowed_users enable row level security;
alter table public.profiles enable row level security;

-- No client-side policies are created for allowed_users on purpose.
-- Treat the allowlist as admin-managed data. Use the Supabase SQL Editor,
-- dashboard, or a trusted service-role backend to insert/update rows.

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
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

create or replace function public.require_allowed_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.allowed_users
    where email = lower(new.email)
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

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;

drop trigger if exists create_profile_for_new_user on auth.users;

create trigger create_profile_for_new_user
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();

-- Example:
-- insert into public.allowed_users (email, note)
-- values ('athlete@example.com', 'Initial beta user')
-- on conflict (email) do nothing;
