-- Phase 6A: Live workout data foundation
--
-- Run after:
--   supabase/migrations/005_add_circuit_template_block_type.sql
--
-- This migration adds the missing middle layer between workout_sessions and
-- workout_sets:
--
--   Workout Session -> Workout Exercise -> Workout Set
--
-- Existing workout_sets remain compatible. New live workout flows should create
-- workout_exercises first, then attach every performed set to a workout_exercise.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Workout session metadata
-- ---------------------------------------------------------------------------

alter table public.workout_sessions
  add column if not exists status text not null default 'active';

alter table public.workout_sessions
  drop constraint if exists workout_sessions_status_check;

alter table public.workout_sessions
  add constraint workout_sessions_status_check
  check (status in ('active', 'completed', 'cancelled'));

create index if not exists workout_sessions_status_idx
on public.workout_sessions (status);

-- ---------------------------------------------------------------------------
-- Workout exercises
-- ---------------------------------------------------------------------------

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  exercise_variant_id uuid references public.exercise_variants(id) on delete set null,
  workout_template_block_id uuid references public.workout_template_blocks(id) on delete set null,
  workout_template_block_exercise_id uuid references public.workout_template_block_exercises(id) on delete set null,
  sort_order integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_exercises_sort_order_check check (sort_order > 0)
);

create index if not exists workout_exercises_session_id_idx
on public.workout_exercises (workout_session_id);

create index if not exists workout_exercises_exercise_id_idx
on public.workout_exercises (exercise_id);

create index if not exists workout_exercises_variant_id_idx
on public.workout_exercises (exercise_variant_id);

create unique index if not exists workout_exercises_session_order_idx
on public.workout_exercises (workout_session_id, sort_order);

drop trigger if exists set_workout_exercises_updated_at on public.workout_exercises;
create trigger set_workout_exercises_updated_at
before update on public.workout_exercises
for each row
execute function public.set_updated_at();

alter table public.workout_exercises enable row level security;

drop policy if exists "Users can read exercises from their sessions" on public.workout_exercises;
drop policy if exists "Users can insert exercises into their sessions" on public.workout_exercises;
drop policy if exists "Users can update exercises in their sessions" on public.workout_exercises;
drop policy if exists "Users can delete exercises from their sessions" on public.workout_exercises;

create policy "Users can read exercises from their sessions"
on public.workout_exercises
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

create policy "Users can insert exercises into their sessions"
on public.workout_exercises
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
  and (
    exercise_variant_id is null
    or exists (
      select 1
      from public.exercise_variants ev
      where ev.id = exercise_variant_id
        and (ev.is_builtin or ev.created_by = auth.uid())
    )
  )
);

create policy "Users can update exercises in their sessions"
on public.workout_exercises
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
  and (
    exercise_variant_id is null
    or exists (
      select 1
      from public.exercise_variants ev
      where ev.id = exercise_variant_id
        and (ev.is_builtin or ev.created_by = auth.uid())
    )
  )
);

create policy "Users can delete exercises from their sessions"
on public.workout_exercises
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
-- Workout sets
-- ---------------------------------------------------------------------------

alter table public.workout_sets
  add column if not exists workout_exercise_id uuid references public.workout_exercises(id) on delete cascade,
  add column if not exists exercise_variant_id uuid references public.exercise_variants(id) on delete set null,
  add column if not exists assistance_kg numeric(7, 2),
  add column if not exists assistance_type text,
  add column if not exists rpe numeric(3, 1),
  add column if not exists rir integer,
  add column if not exists tempo text,
  add column if not exists is_warmup boolean not null default false,
  add column if not exists set_type text not null default 'normal';

alter table public.workout_sets
  drop constraint if exists workout_sets_assistance_kg_check,
  drop constraint if exists workout_sets_rpe_check,
  drop constraint if exists workout_sets_rir_check,
  drop constraint if exists workout_sets_set_type_check;

alter table public.workout_sets
  add constraint workout_sets_assistance_kg_check
    check (assistance_kg is null or assistance_kg >= 0),
  add constraint workout_sets_rpe_check
    check (rpe is null or (rpe >= 0 and rpe <= 10)),
  add constraint workout_sets_rir_check
    check (rir is null or rir >= 0),
  add constraint workout_sets_set_type_check
    check (set_type in ('normal', 'warmup', 'dropset', 'failure', 'assisted', 'forced', 'partial', 'hold', 'timed', 'distance'));

create index if not exists workout_sets_workout_exercise_id_idx
on public.workout_sets (workout_exercise_id);

create index if not exists workout_sets_variant_id_idx
on public.workout_sets (exercise_variant_id);

create index if not exists workout_sets_set_type_idx
on public.workout_sets (set_type);

drop index if exists workout_sets_session_set_number_idx;

create index if not exists workout_sets_session_set_number_idx
on public.workout_sets (workout_session_id, set_number);

create unique index if not exists workout_sets_exercise_set_number_idx
on public.workout_sets (workout_exercise_id, set_number)
where workout_exercise_id is not null;

drop policy if exists "Users can insert sets into their sessions" on public.workout_sets;
drop policy if exists "Users can update sets in their sessions" on public.workout_sets;

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
  and (
    workout_exercise_id is null
    or exists (
      select 1
      from public.workout_exercises we
      join public.workout_sessions ws on ws.id = we.workout_session_id
      where we.id = workout_exercise_id
        and we.workout_session_id = workout_sets.workout_session_id
        and ws.user_id = auth.uid()
    )
  )
  and (
    exercise_variant_id is null
    or exists (
      select 1
      from public.exercise_variants ev
      where ev.id = exercise_variant_id
        and (ev.is_builtin or ev.created_by = auth.uid())
    )
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
  and (
    workout_exercise_id is null
    or exists (
      select 1
      from public.workout_exercises we
      join public.workout_sessions ws on ws.id = we.workout_session_id
      where we.id = workout_exercise_id
        and we.workout_session_id = workout_sets.workout_session_id
        and ws.user_id = auth.uid()
    )
  )
  and (
    exercise_variant_id is null
    or exists (
      select 1
      from public.exercise_variants ev
      where ev.id = exercise_variant_id
        and (ev.is_builtin or ev.created_by = auth.uid())
    )
  )
);
