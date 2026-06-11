-- Phase 4D: Exercise variants foundation
--
-- Run after supabase/migrations/002_extend_exercises.sql.
-- Variants describe common ways to perform an exercise, such as grip,
-- equipment, assistance, loading, or progression changes.

create table if not exists public.exercise_variants (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  name text not null,
  description text,
  variant_type text,
  grip_type text,
  equipment text,
  assistance_type text,
  load_type text,
  progression_level integer,
  sort_order integer not null default 0,
  is_builtin boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exercise_variants_builtin_owner_check
    check ((is_builtin and created_by is null) or (not is_builtin and created_by is not null)),
  constraint exercise_variants_progression_level_check
    check (progression_level is null or progression_level > 0)
);

create index if not exists exercise_variants_exercise_id_idx
on public.exercise_variants (exercise_id);

create index if not exists exercise_variants_created_by_idx
on public.exercise_variants (created_by);

create index if not exists exercise_variants_variant_type_idx
on public.exercise_variants (variant_type);

drop trigger if exists set_exercise_variants_updated_at on public.exercise_variants;
create trigger set_exercise_variants_updated_at
before update on public.exercise_variants
for each row
execute function public.set_updated_at();

alter table public.exercise_variants enable row level security;

drop policy if exists "Authenticated users can read builtin exercise variants" on public.exercise_variants;
drop policy if exists "Users can read their own exercise variants" on public.exercise_variants;
drop policy if exists "Users can insert their own exercise variants" on public.exercise_variants;
drop policy if exists "Users can update their own exercise variants" on public.exercise_variants;
drop policy if exists "Users can delete their own exercise variants" on public.exercise_variants;

create policy "Authenticated users can read builtin exercise variants"
on public.exercise_variants
for select
to authenticated
using (is_builtin);

create policy "Users can read their own exercise variants"
on public.exercise_variants
for select
to authenticated
using (created_by = auth.uid());

create policy "Users can insert their own exercise variants"
on public.exercise_variants
for insert
to authenticated
with check (
  created_by = auth.uid()
  and not is_builtin
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_builtin or e.owner_id = auth.uid())
  )
);

create policy "Users can update their own exercise variants"
on public.exercise_variants
for update
to authenticated
using (created_by = auth.uid() and not is_builtin)
with check (
  created_by = auth.uid()
  and not is_builtin
  and exists (
    select 1
    from public.exercises e
    where e.id = exercise_id
      and (e.is_builtin or e.owner_id = auth.uid())
  )
);

create policy "Users can delete their own exercise variants"
on public.exercise_variants
for delete
to authenticated
using (created_by = auth.uid() and not is_builtin);

comment on table public.exercise_variants is
  'Exercise-specific variants such as pull-up grips, push-up variations, assisted versions, weighted versions, and calisthenics progressions.';
