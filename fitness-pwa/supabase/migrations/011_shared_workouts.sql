-- Phase 9D: Shared workouts foundation.
--
-- Internal table names stay as workout_templates for compatibility.
-- User-facing concepts:
-- - private: visible only to the owner in My Workouts
-- - shared: visible to authenticated users in Ready Workouts
-- - builtin: app-provided workouts, also visible in Ready Workouts

alter table public.workout_templates
  add column if not exists visibility text not null default 'private',
  add column if not exists shared_at timestamptz,
  add column if not exists shared_by uuid references public.profiles(id) on delete set null;

alter table public.workout_templates
  drop constraint if exists workout_templates_visibility_check;

alter table public.workout_templates
  add constraint workout_templates_visibility_check
  check (visibility in ('private', 'shared', 'builtin'));

-- Keep existing is_builtin compatibility while introducing visibility.
update public.workout_templates
set visibility = 'builtin'
where is_builtin = true
  and visibility <> 'builtin';

update public.workout_templates
set visibility = 'private'
where is_builtin = false
  and visibility = 'builtin';

update public.workout_templates
set
  shared_by = coalesce(shared_by, owner_id),
  shared_at = coalesce(shared_at, now())
where visibility = 'shared'
  and owner_id is not null;

create index if not exists workout_templates_visibility_idx
on public.workout_templates (visibility);

create index if not exists workout_templates_shared_by_idx
on public.workout_templates (shared_by);

create index if not exists workout_templates_shared_at_idx
on public.workout_templates (shared_at desc)
where visibility = 'shared';

-- Users may see the display name/email of people who have shared workouts.
drop policy if exists "Users can read profiles for shared workouts" on public.profiles;

create policy "Users can read profiles for shared workouts"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_templates wt
    where wt.shared_by = profiles.id
      and wt.visibility = 'shared'
  )
);

-- ---------------------------------------------------------------------------
-- Template RLS
-- ---------------------------------------------------------------------------

drop policy if exists "Authenticated users can read builtin templates" on public.workout_templates;
drop policy if exists "Users can read their own templates" on public.workout_templates;
drop policy if exists "Users can insert their own templates" on public.workout_templates;
drop policy if exists "Users can update their own templates" on public.workout_templates;
drop policy if exists "Users can delete their own templates" on public.workout_templates;
drop policy if exists "Users can read accessible workout templates" on public.workout_templates;
drop policy if exists "Users can insert their own workout templates" on public.workout_templates;
drop policy if exists "Users can update their own workout templates" on public.workout_templates;
drop policy if exists "Users can delete their own workout templates" on public.workout_templates;

create policy "Users can read accessible workout templates"
on public.workout_templates
for select
to authenticated
using (
  owner_id = auth.uid()
  or visibility in ('shared', 'builtin')
  or is_builtin = true
);

create policy "Users can insert their own workout templates"
on public.workout_templates
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and is_builtin = false
  and visibility in ('private', 'shared')
  and (
    visibility = 'private'
    or (
      shared_by = auth.uid()
      and shared_at is not null
    )
  )
);

create policy "Users can update their own workout templates"
on public.workout_templates
for update
to authenticated
using (
  owner_id = auth.uid()
  and is_builtin = false
)
with check (
  owner_id = auth.uid()
  and is_builtin = false
  and visibility in ('private', 'shared')
  and (
    visibility = 'private'
    or (
      shared_by = auth.uid()
      and shared_at is not null
    )
  )
);

create policy "Users can delete their own workout templates"
on public.workout_templates
for delete
to authenticated
using (
  owner_id = auth.uid()
  and is_builtin = false
);

-- ---------------------------------------------------------------------------
-- Template block RLS follows parent template visibility for reads.
-- Writes remain owner-only.
-- ---------------------------------------------------------------------------

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
      and (
        wt.owner_id = auth.uid()
        or wt.visibility in ('shared', 'builtin')
        or wt.is_builtin = true
      )
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
      and wt.is_builtin = false
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
      and wt.is_builtin = false
  )
)
with check (
  exists (
    select 1
    from public.workout_templates wt
    where wt.id = workout_template_id
      and wt.owner_id = auth.uid()
      and wt.is_builtin = false
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
      and wt.is_builtin = false
  )
);

-- ---------------------------------------------------------------------------
-- Template block exercise RLS follows parent template visibility for reads.
-- Writes remain owner-only.
-- ---------------------------------------------------------------------------

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
      and (
        wt.owner_id = auth.uid()
        or wt.visibility in ('shared', 'builtin')
        or wt.is_builtin = true
      )
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
      and wt.is_builtin = false
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
      and wt.is_builtin = false
  )
)
with check (
  exists (
    select 1
    from public.workout_template_blocks wtb
    join public.workout_templates wt on wt.id = wtb.workout_template_id
    where wtb.id = workout_template_block_id
      and wt.owner_id = auth.uid()
      and wt.is_builtin = false
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
      and wt.is_builtin = false
  )
);
