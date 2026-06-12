-- Phase 6E: profile foundation for live workout pre-fill preferences.
-- Run this after 006_live_workout_foundation.sql.

alter table public.profiles
  add column if not exists pre_fill_mode text not null default 'LAST_WORKOUT';

alter table public.profiles
  drop constraint if exists profiles_pre_fill_mode_check;

alter table public.profiles
  add constraint profiles_pre_fill_mode_check
    check (pre_fill_mode in ('LAST_WORKOUT', 'TEMPLATE', 'EMPTY'));
