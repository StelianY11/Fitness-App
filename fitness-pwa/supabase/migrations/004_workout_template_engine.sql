-- Phase 5A: Workout template engine foundation
--
-- Run after:
--   1. supabase/schema.sql
--   2. supabase/migrations/001_fitness_schema.sql
--   3. supabase/migrations/002_extend_exercises.sql
--   4. supabase/migrations/003_exercise_variants.sql
--
-- This migration keeps the existing workout history tables unchanged. It adds
-- a block-based template structure that can represent normal workouts, warmups,
-- supersets, dropsets, giant sets, and note-only blocks.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Workout templates
-- ---------------------------------------------------------------------------

alter table public.workout_templates
  add column if not exists goal text,
  add column if not exists difficulty text,
  add column if not exists estimated_duration_minutes integer;

alter table public.workout_templates
  drop constraint if exists workout_templates_estimated_duration_check;

alter table public.workout_templates
  add constraint workout_templates_estimated_duration_check
  check (
    estimated_duration_minutes is null
    or estimated_duration_minutes > 0
  );

create index if not exists workout_templates_goal_idx
on public.workout_templates (goal);

create index if not exists workout_templates_difficulty_idx
on public.workout_templates (difficulty);

-- ---------------------------------------------------------------------------
-- Template blocks
-- ---------------------------------------------------------------------------

create table if not exists public.workout_template_blocks (
  id uuid primary key default gen_random_uuid(),
  workout_template_id uuid not null references public.workout_templates(id) on delete cascade,
  title text,
  block_type text not null default 'normal',
  sort_order integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_blocks_type_check
    check (block_type in ('normal', 'warmup', 'superset', 'dropset', 'giant_set', 'notes')),
  constraint workout_template_blocks_sort_order_check
    check (sort_order > 0)
);

create index if not exists workout_template_blocks_template_id_idx
on public.workout_template_blocks (workout_template_id);

create index if not exists workout_template_blocks_type_idx
on public.workout_template_blocks (block_type);

create unique index if not exists workout_template_blocks_template_order_idx
on public.workout_template_blocks (workout_template_id, sort_order);

drop trigger if exists set_workout_template_blocks_updated_at on public.workout_template_blocks;
create trigger set_workout_template_blocks_updated_at
before update on public.workout_template_blocks
for each row
execute function public.set_updated_at();

alter table public.workout_template_blocks enable row level security;

drop policy if exists "Users can read accessible template blocks" on public.workout_template_blocks;
drop policy if exists "Users can insert blocks into their templates" on public.workout_template_blocks;
drop policy if exists "Users can update blocks in their templates" on public.workout_template_blocks;
drop policy if exists "Users can delete blocks from their templates" on public.workout_template_blocks;

create policy "Users can read accessible template blocks"
on public.workout_template_blocks
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

create policy "Users can insert blocks into their templates"
on public.workout_template_blocks
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
);

create policy "Users can update blocks in their templates"
on public.workout_template_blocks
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
);

create policy "Users can delete blocks from their templates"
on public.workout_template_blocks
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
-- Template block exercises
-- ---------------------------------------------------------------------------

create table if not exists public.workout_template_block_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_template_block_id uuid not null references public.workout_template_blocks(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete restrict,
  exercise_variant_id uuid references public.exercise_variants(id) on delete set null,
  sort_order integer not null default 1,
  set_type text not null default 'working',
  target_sets integer,
  target_reps text,
  target_weight_kg numeric(7, 2),
  target_duration_seconds integer,
  target_distance_meters numeric(8, 2),
  rest_seconds integer,
  tempo text,
  rir integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_template_block_exercises_sort_order_check
    check (sort_order > 0),
  constraint workout_template_block_exercises_set_type_check
    check (set_type in ('warmup', 'working', 'dropset', 'backoff', 'failure', 'note')),
  constraint workout_template_block_exercises_target_sets_check
    check (target_sets is null or target_sets > 0),
  constraint workout_template_block_exercises_weight_check
    check (target_weight_kg is null or target_weight_kg >= 0),
  constraint workout_template_block_exercises_duration_check
    check (target_duration_seconds is null or target_duration_seconds >= 0),
  constraint workout_template_block_exercises_distance_check
    check (target_distance_meters is null or target_distance_meters >= 0),
  constraint workout_template_block_exercises_rest_check
    check (rest_seconds is null or rest_seconds >= 0),
  constraint workout_template_block_exercises_rir_check
    check (rir is null or rir >= 0)
);

create index if not exists workout_template_block_exercises_block_id_idx
on public.workout_template_block_exercises (workout_template_block_id);

create index if not exists workout_template_block_exercises_exercise_id_idx
on public.workout_template_block_exercises (exercise_id);

create index if not exists workout_template_block_exercises_variant_id_idx
on public.workout_template_block_exercises (exercise_variant_id);

create index if not exists workout_template_block_exercises_set_type_idx
on public.workout_template_block_exercises (set_type);

create unique index if not exists workout_template_block_exercises_block_order_idx
on public.workout_template_block_exercises (workout_template_block_id, sort_order);

drop trigger if exists set_workout_template_block_exercises_updated_at on public.workout_template_block_exercises;
create trigger set_workout_template_block_exercises_updated_at
before update on public.workout_template_block_exercises
for each row
execute function public.set_updated_at();

alter table public.workout_template_block_exercises enable row level security;

drop policy if exists "Users can read accessible template block exercises" on public.workout_template_block_exercises;
drop policy if exists "Users can insert exercises into their template blocks" on public.workout_template_block_exercises;
drop policy if exists "Users can update exercises in their template blocks" on public.workout_template_block_exercises;
drop policy if exists "Users can delete exercises from their template blocks" on public.workout_template_block_exercises;

create policy "Users can read accessible template block exercises"
on public.workout_template_block_exercises
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_template_blocks wtb
    join public.workout_templates wt on wt.id = wtb.workout_template_id
    where wtb.id = workout_template_block_id
      and (wt.is_builtin or wt.owner_id = auth.uid())
  )
);

create policy "Users can insert exercises into their template blocks"
on public.workout_template_block_exercises
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_template_blocks wtb
    join public.workout_templates wt on wt.id = wtb.workout_template_id
    where wtb.id = workout_template_block_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
  and (
    exercise_id is null
    or exists (
      select 1
      from public.exercises e
      where e.id = exercise_id
        and (e.is_builtin or e.owner_id = auth.uid())
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

create policy "Users can update exercises in their template blocks"
on public.workout_template_block_exercises
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_template_blocks wtb
    join public.workout_templates wt on wt.id = wtb.workout_template_id
    where wtb.id = workout_template_block_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
)
with check (
  exists (
    select 1
    from public.workout_template_blocks wtb
    join public.workout_templates wt on wt.id = wtb.workout_template_id
    where wtb.id = workout_template_block_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
  and (
    exercise_id is null
    or exists (
      select 1
      from public.exercises e
      where e.id = exercise_id
        and (e.is_builtin or e.owner_id = auth.uid())
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

create policy "Users can delete exercises from their template blocks"
on public.workout_template_block_exercises
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_template_blocks wtb
    join public.workout_templates wt on wt.id = wtb.workout_template_id
    where wtb.id = workout_template_block_id
      and wt.owner_id = auth.uid()
      and not wt.is_builtin
  )
);
