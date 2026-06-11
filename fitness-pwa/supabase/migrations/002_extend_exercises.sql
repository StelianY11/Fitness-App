-- Phase 4C: Extend exercises for Gym, Calisthenics, and Street Workout
--
-- Run after supabase/migrations/001_fitness_schema.sql.
-- Existing seed data remains valid because classification fields are nullable
-- and capability flags have conservative defaults.

alter table public.exercises
add column if not exists training_type text,
add column if not exists exercise_type text,
add column if not exists progression_group text,
add column if not exists progression_level integer,
add column if not exists default_unit text,
add column if not exists supports_weight boolean not null default false,
add column if not exists supports_assistance boolean not null default false,
add column if not exists supports_duration boolean not null default false,
add column if not exists supports_distance boolean not null default false;

alter table public.exercises
drop constraint if exists exercises_training_type_check,
add constraint exercises_training_type_check
check (
  training_type is null
  or training_type in ('gym', 'calisthenics', 'street_workout', 'cardio', 'mobility')
);

alter table public.exercises
drop constraint if exists exercises_exercise_type_check,
add constraint exercises_exercise_type_check
check (
  exercise_type is null
  or exercise_type in (
    'gym',
    'bodyweight',
    'weighted_bodyweight',
    'assisted',
    'hold',
    'time',
    'distance'
  )
);

alter table public.exercises
drop constraint if exists exercises_progression_level_check,
add constraint exercises_progression_level_check
check (progression_level is null or progression_level > 0);

alter table public.exercises
drop constraint if exists exercises_default_unit_check,
add constraint exercises_default_unit_check
check (
  default_unit is null
  or default_unit in ('reps', 'kg', 'seconds', 'minutes', 'meters', 'kilometers')
);

create index if not exists exercises_training_type_idx
on public.exercises (training_type);

create index if not exists exercises_exercise_type_idx
on public.exercises (exercise_type);

create index if not exists exercises_progression_group_idx
on public.exercises (progression_group);

comment on column public.exercises.training_type is
  'Broad training context, such as gym, calisthenics, street_workout, cardio, or mobility.';

comment on column public.exercises.exercise_type is
  'Exercise measurement/style type, such as gym, bodyweight, weighted_bodyweight, assisted, hold, time, or distance.';

comment on column public.exercises.progression_group is
  'Optional shared progression family, for example push_up, pull_up, dip, squat, or handstand.';

comment on column public.exercises.progression_level is
  'Optional difficulty/progression order within a progression group. Lower numbers are easier.';

comment on column public.exercises.default_unit is
  'Default logging unit for the exercise, such as reps, kg, seconds, minutes, meters, or kilometers.';

comment on column public.exercises.supports_weight is
  'Whether the exercise can be logged with added external weight.';

comment on column public.exercises.supports_assistance is
  'Whether the exercise can be logged with assistance, such as bands or assisted machines.';

comment on column public.exercises.supports_duration is
  'Whether the exercise can be logged by duration.';

comment on column public.exercises.supports_distance is
  'Whether the exercise can be logged by distance.';
