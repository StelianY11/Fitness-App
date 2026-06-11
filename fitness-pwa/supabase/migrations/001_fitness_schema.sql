-- Phase 3A: Fitness schema
--
-- Run this migration in Supabase after the auth foundation has been reviewed.
-- It creates the core fitness tables only. No workout UI or app services depend
-- on this file yet.
--
-- Data ownership model:
-- - profiles are keyed by auth.users.id.
-- - private user data has user_id or owner_id = auth.uid().
-- - builtin categories, exercises, and templates use is_builtin = true and
--   owner_id = null. They are readable by authenticated users, but are intended
--   to be managed only from trusted SQL/service-role contexts.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

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
-- Exercise library
-- ---------------------------------------------------------------------------

create table if not exists public.exercise_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_categories_builtin_owner_check
    check ((is_builtin and owner_id is null) or (not is_builtin and owner_id is not null))
);

create index if not exists exercise_categories_owner_id_idx
on public.exercise_categories (owner_id);

create index if not exists exercise_categories_builtin_idx
on public.exercise_categories (is_builtin);

drop trigger if exists set_exercise_categories_updated_at on public.exercise_categories;
create trigger set_exercise_categories_updated_at
before update on public.exercise_categories
for each row
execute function public.set_updated_at();

alter table public.exercise_categories enable row level security;

drop policy if exists "Authenticated users can read builtin categories" on public.exercise_categories;
drop policy if exists "Users can read their own categories" on public.exercise_categories;
drop policy if exists "Users can insert their own categories" on public.exercise_categories;
drop policy if exists "Users can update their own categories" on public.exercise_categories;
drop policy if exists "Users can delete their own categories" on public.exercise_categories;

create policy "Authenticated users can read builtin categories"
on public.exercise_categories
for select
to authenticated
using (is_builtin);

create policy "Users can read their own categories"
on public.exercise_categories
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own categories"
on public.exercise_categories
for insert
to authenticated
with check (owner_id = auth.uid() and not is_builtin);

create policy "Users can update their own categories"
on public.exercise_categories
for update
to authenticated
using (owner_id = auth.uid() and not is_builtin)
with check (owner_id = auth.uid() and not is_builtin);

create policy "Users can delete their own categories"
on public.exercise_categories
for delete
to authenticated
using (owner_id = auth.uid() and not is_builtin);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.exercise_categories(id) on delete set null,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  instructions text,
  muscle_groups text[] not null default '{}',
  equipment text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercises_builtin_owner_check
    check ((is_builtin and owner_id is null) or (not is_builtin and owner_id is not null))
);

create index if not exists exercises_category_id_idx on public.exercises (category_id);
create index if not exists exercises_owner_id_idx on public.exercises (owner_id);
create index if not exists exercises_builtin_idx on public.exercises (is_builtin);
create index if not exists exercises_name_idx on public.exercises (name);

drop trigger if exists set_exercises_updated_at on public.exercises;
create trigger set_exercises_updated_at
before update on public.exercises
for each row
execute function public.set_updated_at();

alter table public.exercises enable row level security;

drop policy if exists "Authenticated users can read builtin exercises" on public.exercises;
drop policy if exists "Users can read their own exercises" on public.exercises;
drop policy if exists "Users can insert their own exercises" on public.exercises;
drop policy if exists "Users can update their own exercises" on public.exercises;
drop policy if exists "Users can delete their own exercises" on public.exercises;

create policy "Authenticated users can read builtin exercises"
on public.exercises
for select
to authenticated
using (is_builtin);

create policy "Users can read their own exercises"
on public.exercises
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own exercises"
on public.exercises
for insert
to authenticated
with check (owner_id = auth.uid() and not is_builtin);

create policy "Users can update their own exercises"
on public.exercises
for update
to authenticated
using (owner_id = auth.uid() and not is_builtin)
with check (owner_id = auth.uid() and not is_builtin);

create policy "Users can delete their own exercises"
on public.exercises
for delete
to authenticated
using (owner_id = auth.uid() and not is_builtin);

-- ---------------------------------------------------------------------------
-- Workout templates
-- ---------------------------------------------------------------------------

create table if not exists public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_templates_builtin_owner_check
    check ((is_builtin and owner_id is null) or (not is_builtin and owner_id is not null))
);

create index if not exists workout_templates_owner_id_idx
on public.workout_templates (owner_id);

create index if not exists workout_templates_builtin_idx
on public.workout_templates (is_builtin);

drop trigger if exists set_workout_templates_updated_at on public.workout_templates;
create trigger set_workout_templates_updated_at
before update on public.workout_templates
for each row
execute function public.set_updated_at();

alter table public.workout_templates enable row level security;

drop policy if exists "Authenticated users can read builtin templates" on public.workout_templates;
drop policy if exists "Users can read their own templates" on public.workout_templates;
drop policy if exists "Users can insert their own templates" on public.workout_templates;
drop policy if exists "Users can update their own templates" on public.workout_templates;
drop policy if exists "Users can delete their own templates" on public.workout_templates;

create policy "Authenticated users can read builtin templates"
on public.workout_templates
for select
to authenticated
using (is_builtin);

create policy "Users can read their own templates"
on public.workout_templates
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own templates"
on public.workout_templates
for insert
to authenticated
with check (owner_id = auth.uid() and not is_builtin);

create policy "Users can update their own templates"
on public.workout_templates
for update
to authenticated
using (owner_id = auth.uid() and not is_builtin)
with check (owner_id = auth.uid() and not is_builtin);

create policy "Users can delete their own templates"
on public.workout_templates
for delete
to authenticated
using (owner_id = auth.uid() and not is_builtin);

create table if not exists public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null default 1,
  target_sets integer,
  target_reps text,
  rest_seconds integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_exercises_position_check check (position > 0),
  constraint workout_template_exercises_target_sets_check check (target_sets is null or target_sets > 0),
  constraint workout_template_exercises_rest_seconds_check check (rest_seconds is null or rest_seconds >= 0)
);

create index if not exists workout_template_exercises_template_id_idx
on public.workout_template_exercises (workout_template_id);

create index if not exists workout_template_exercises_exercise_id_idx
on public.workout_template_exercises (exercise_id);

create unique index if not exists workout_template_exercises_template_position_idx
on public.workout_template_exercises (workout_template_id, position);

drop trigger if exists set_workout_template_exercises_updated_at on public.workout_template_exercises;
create trigger set_workout_template_exercises_updated_at
before update on public.workout_template_exercises
for each row
execute function public.set_updated_at();

alter table public.workout_template_exercises enable row level security;

drop policy if exists "Users can read accessible template exercises" on public.workout_template_exercises;
drop policy if exists "Users can insert exercises into their templates" on public.workout_template_exercises;
drop policy if exists "Users can update exercises in their templates" on public.workout_template_exercises;
drop policy if exists "Users can delete exercises from their templates" on public.workout_template_exercises;

create policy "Users can read accessible template exercises"
on public.workout_template_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and (wt.is_builtin or wt.owner_id = auth.uid())
  )
);

create policy "Users can insert exercises into their templates"
on public.workout_template_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_builtin or e.owner_id = auth.uid())
  )
);

create policy "Users can update exercises in their templates"
on public.workout_template_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
)
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_builtin or e.owner_id = auth.uid())
  )
);

create policy "Users can delete exercises from their templates"
on public.workout_template_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
);

-- ---------------------------------------------------------------------------
-- Workout logging
-- ---------------------------------------------------------------------------

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_template_id uuid references public.workout_templates(id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sessions_finished_after_started_check
    check (finished_at is null or finished_at >= started_at)
);

create index if not exists workout_sessions_user_id_idx
on public.workout_sessions (user_id);

create index if not exists workout_sessions_template_id_idx
on public.workout_sessions (workout_template_id);

create index if not exists workout_sessions_started_at_idx
on public.workout_sessions (started_at desc);

drop trigger if exists set_workout_sessions_updated_at on public.workout_sessions;
create trigger set_workout_sessions_updated_at
before update on public.workout_sessions
for each row
execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;

drop policy if exists "Users can read their own workout sessions" on public.workout_sessions;
drop policy if exists "Users can insert their own workout sessions" on public.workout_sessions;
drop policy if exists "Users can update their own workout sessions" on public.workout_sessions;
drop policy if exists "Users can delete their own workout sessions" on public.workout_sessions;

create policy "Users can read their own workout sessions"
on public.workout_sessions
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own workout sessions"
on public.workout_sessions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    workout_template_id is null
    or exists (
      select 1
      from public.workout_templates wt
      where wt.id = workout_template_id
        and (wt.is_builtin or wt.owner_id = auth.uid())
    )
  )
);

create policy "Users can update their own workout sessions"
on public.workout_sessions
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    workout_template_id is null
    or exists (
      select 1
      from public.workout_templates wt
      where wt.id = workout_template_id
        and (wt.is_builtin or wt.owner_id = auth.uid())
    )
  )
);

create policy "Users can delete their own workout sessions"
on public.workout_sessions
for delete
to authenticated
using (user_id = auth.uid());

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  set_number integer not null,
  reps integer,
  weight_kg numeric(7, 2),
  duration_seconds integer,
  distance_meters numeric(8, 2),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_sets_set_number_check check (set_number > 0),
  constraint workout_sets_reps_check check (reps is null or reps >= 0),
  constraint workout_sets_weight_kg_check check (weight_kg is null or weight_kg >= 0),
  constraint workout_sets_duration_seconds_check check (duration_seconds is null or duration_seconds >= 0),
  constraint workout_sets_distance_meters_check check (distance_meters is null or distance_meters >= 0)
);

create index if not exists workout_sets_session_id_idx
on public.workout_sets (workout_session_id);

create index if not exists workout_sets_exercise_id_idx
on public.workout_sets (exercise_id);

create unique index if not exists workout_sets_session_set_number_idx
on public.workout_sets (workout_session_id, set_number);

drop trigger if exists set_workout_sets_updated_at on public.workout_sets;
create trigger set_workout_sets_updated_at
before update on public.workout_sets
for each row
execute function public.set_updated_at();

alter table public.workout_sets enable row level security;

drop policy if exists "Users can read sets from their sessions" on public.workout_sets;
drop policy if exists "Users can insert sets into their sessions" on public.workout_sets;
drop policy if exists "Users can update sets in their sessions" on public.workout_sets;
drop policy if exists "Users can delete sets from their sessions" on public.workout_sets;

create policy "Users can read sets from their sessions"
on public.workout_sets
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
);

create policy "Users can insert sets into their sessions"
on public.workout_sets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_builtin or e.owner_id = auth.uid())
  )
);

create policy "Users can update sets in their sessions"
on public.workout_sets
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_builtin or e.owner_id = auth.uid())
  )
);

create policy "Users can delete sets from their sessions"
on public.workout_sets
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    where ws.id = workout_session_id
      and ws.user_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Body weight history
-- ---------------------------------------------------------------------------

create table if not exists public.body_weight_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  weight_kg numeric(5, 2) not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint body_weight_history_weight_kg_check check (weight_kg > 0)
);

create index if not exists body_weight_history_user_id_idx
on public.body_weight_history (user_id);

create index if not exists body_weight_history_measured_at_idx
on public.body_weight_history (measured_at desc);

drop trigger if exists set_body_weight_history_updated_at on public.body_weight_history;
create trigger set_body_weight_history_updated_at
before update on public.body_weight_history
for each row
execute function public.set_updated_at();

alter table public.body_weight_history enable row level security;

drop policy if exists "Users can read their own body weight history" on public.body_weight_history;
drop policy if exists "Users can insert their own body weight history" on public.body_weight_history;
drop policy if exists "Users can update their own body weight history" on public.body_weight_history;
drop policy if exists "Users can delete their own body weight history" on public.body_weight_history;

create policy "Users can read their own body weight history"
on public.body_weight_history
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can insert their own body weight history"
on public.body_weight_history
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own body weight history"
on public.body_weight_history
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own body weight history"
on public.body_weight_history
for delete
to authenticated
using (user_id = auth.uid());
