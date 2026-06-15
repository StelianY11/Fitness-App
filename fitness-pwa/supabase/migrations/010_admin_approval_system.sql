-- Phase 9B: Replace manual allowlist signup blocking with admin approval.
--
-- IMPORTANT BEFORE RUNNING:
-- 1. Replace YOUR_EMAIL_HERE below with your own account email.
-- 2. Run this in Supabase SQL Editor or through your migration workflow.
-- 3. New users can sign up normally, but their profiles start as pending.
-- 4. Only approved users can access the Angular app; only admins can approve users.
--
-- This migration intentionally keeps public.allowed_users in place as historical
-- admin-managed data, but removes the auth.users trigger that blocked signup.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  drop constraint if exists profiles_approval_status_check;

alter table public.profiles
  add constraint profiles_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists profiles_approval_status_idx
on public.profiles (approval_status);

create index if not exists profiles_is_admin_idx
on public.profiles (is_admin)
where is_admin = true;

-- Stop blocking Supabase Auth signup by allowlist.
drop trigger if exists require_allowed_user_email on auth.users;
drop function if exists public.require_allowed_user_email();

-- Existing users have already been allowed into the app, so keep them approved.
update public.profiles
set
  approval_status = 'approved',
  approved_at = coalesce(approved_at, now())
where approval_status = 'pending';

-- Set the first admin. Replace YOUR_EMAIL_HERE before running.
do $$
declare
  admin_email text := lower(trim('YOUR_EMAIL_HERE'));
begin
  if admin_email = 'your_email_here' or admin_email = '' then
    raise exception 'Replace YOUR_EMAIL_HERE in 010_admin_approval_system.sql before running this migration.';
  end if;

  update public.profiles
  set
    is_admin = true,
    approval_status = 'approved',
    approved_at = coalesce(approved_at, now())
  where lower(trim(email)) = admin_email;

  if not found then
    raise exception 'No profile found for initial admin email: %. Sign up or create the profile first, then rerun.', admin_email;
  end if;
end $$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin = true
      and approval_status = 'approved'
  );
$$;

create or replace function public.protect_profile_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Let trusted SQL migrations/admin SQL run without a JWT context.
  if auth.uid() is null then
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    raise exception 'Client updates to is_admin are not allowed.';
  end if;

  if (
    new.approval_status is distinct from old.approval_status
    or new.approved_at is distinct from old.approved_at
    or new.approved_by is distinct from old.approved_by
  ) and not public.is_current_user_admin() then
    raise exception 'Only admins can update approval fields.';
  end if;

  if new.id is distinct from old.id then
    raise exception 'Profile id cannot be changed.';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_admin_fields on public.profiles;

create trigger protect_profile_admin_fields
before update on public.profiles
for each row
execute function public.protect_profile_admin_fields();

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
    pre_fill_mode,
    approval_status,
    is_admin
  )
  values (
    new.id,
    normalized_email,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    'LAST_WORKOUT',
    'pending',
    false
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    pre_fill_mode = coalesce(public.profiles.pre_fill_mode, excluded.pre_fill_mode),
    approval_status = coalesce(public.profiles.approval_status, 'pending'),
    is_admin = coalesce(public.profiles.is_admin, false),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists create_profile_for_new_user on auth.users;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists handle_new_user on auth.users;
drop trigger if exists handle_new_user_trigger on auth.users;

create trigger create_profile_for_new_user
after insert on auth.users
for each row
execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can read profiles" on public.profiles;
drop policy if exists "Admins can update profile approvals" on public.profiles;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Admins can read profiles"
on public.profiles
for select
to authenticated
using (public.is_current_user_admin());

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins can update profile approvals"
on public.profiles
for update
to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Diagnostics:
-- List auth.users triggers:
-- select trigger_name, action_timing, event_manipulation, action_statement
-- from information_schema.triggers
-- where event_object_schema = 'auth'
--   and event_object_table = 'users'
-- order by trigger_name;
--
-- Confirm initial admin:
-- select id, email, approval_status, is_admin, approved_at
-- from public.profiles
-- where lower(trim(email)) = lower(trim('YOUR_EMAIL_HERE'));
--
-- Check pending users:
-- select id, email, approval_status, created_at
-- from public.profiles
-- where approval_status = 'pending'
-- order by created_at;
