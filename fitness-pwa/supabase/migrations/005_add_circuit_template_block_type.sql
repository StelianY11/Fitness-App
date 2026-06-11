-- Phase 5D: Add circuit as a supported workout template block type.
--
-- Run after supabase/migrations/004_workout_template_engine.sql.

alter table public.workout_template_blocks
  drop constraint if exists workout_template_blocks_type_check;

alter table public.workout_template_blocks
  add constraint workout_template_blocks_type_check
  check (block_type in ('normal', 'warmup', 'superset', 'dropset', 'giant_set', 'circuit', 'notes'));
