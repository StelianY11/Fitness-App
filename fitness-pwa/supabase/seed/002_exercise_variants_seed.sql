-- Phase 4E: Starter exercise variants seed
--
-- Run after supabase/migrations/003_exercise_variants.sql and
-- supabase/seed/001_exercises_seed.sql.
-- This seed is safe to run more than once. Variants are skipped when the same
-- builtin variant name already exists for the same base exercise.
--
-- Note: variants join existing exercises by name. If a base exercise is not in
-- the exercise seed yet, its variants are skipped without error.

insert into public.exercise_variants (
  exercise_id,
  name,
  description,
  variant_type,
  grip_type,
  equipment,
  assistance_type,
  load_type,
  progression_level,
  sort_order,
  is_builtin,
  created_by
)
select
  exercise.id,
  variant.name,
  variant.description,
  variant.variant_type,
  variant.grip_type,
  variant.equipment,
  variant.assistance_type,
  variant.load_type,
  variant.progression_level,
  variant.sort_order,
  true,
  null
from (
  values
    ('Pull-Up', 'Overhand Pull-Up', 'Standard pronated grip pull-up.', 'grip', 'overhand', 'Pull-up bar', null, 'bodyweight', 2, 10),
    ('Pull-Up', 'Chin-Up', 'Underhand grip pull-up variation.', 'grip', 'underhand', 'Pull-up bar', null, 'bodyweight', 2, 20),
    ('Pull-Up', 'Neutral-Grip Pull-Up', 'Pull-up with palms facing each other.', 'grip', 'neutral', 'Pull-up bar', null, 'bodyweight', 2, 30),
    ('Pull-Up', 'Wide-Grip Pull-Up', 'Pull-up with a wider overhand grip.', 'grip', 'wide', 'Pull-up bar', null, 'bodyweight', 3, 40),
    ('Pull-Up', 'Band-Assisted Pull-Up', 'Pull-up supported by a resistance band.', 'assistance', 'overhand', 'Pull-up bar', 'band', 'assisted', 1, 50),
    ('Pull-Up', 'Weighted Pull-Up', 'Pull-up performed with added weight.', 'load', 'overhand', 'Pull-up bar', null, 'weighted', 4, 60),

    ('Push-Up', 'Standard Push-Up', 'Classic bodyweight push-up.', 'progression', null, 'Bodyweight', null, 'bodyweight', 1, 10),
    ('Push-Up', 'Diamond Push-Up', 'Close-hand push-up emphasizing triceps.', 'variation', 'close', 'Bodyweight', null, 'bodyweight', 3, 20),
    ('Push-Up', 'Wide Push-Up', 'Push-up with a wider hand position.', 'variation', 'wide', 'Bodyweight', null, 'bodyweight', 2, 30),
    ('Push-Up', 'Decline Push-Up', 'Push-up with feet elevated.', 'progression', null, 'Bodyweight', null, 'bodyweight', 3, 40),
    ('Push-Up', 'Explosive Push-Up', 'Power push-up with a fast drive.', 'power', null, 'Bodyweight', null, 'bodyweight', 4, 50),

    ('Dip', 'Parallel Bar Dip', 'Standard dip on parallel bars.', 'equipment', null, 'Parallel bars', null, 'bodyweight', 2, 10),
    ('Dip', 'Weighted Dip', 'Dip performed with added weight.', 'load', null, 'Parallel bars', null, 'weighted', 4, 20),
    ('Dip', 'Band-Assisted Dip', 'Dip supported by a resistance band.', 'assistance', null, 'Parallel bars', 'band', 'assisted', 1, 30),

    ('Squat', 'Bodyweight Squat', 'Squat performed without external load.', 'load', null, 'Bodyweight', null, 'bodyweight', 1, 10),
    ('Squat', 'Barbell Back Squat', 'Back-loaded barbell squat.', 'load', null, 'Barbell', null, 'weighted', 3, 20),
    ('Squat', 'Goblet Squat', 'Squat holding one weight at the chest.', 'load', null, 'Dumbbell or kettlebell', null, 'weighted', 2, 30),

    ('Plank', 'Standard Plank', 'Front plank hold.', 'hold', null, 'Bodyweight', null, 'bodyweight', 1, 10),
    ('Plank', 'Side Plank', 'Side-facing plank hold.', 'hold', null, 'Bodyweight', null, 'bodyweight', 2, 20),

    ('Bench Press', 'Flat Barbell Bench Press', 'Flat bench press with a barbell.', 'equipment', null, 'Barbell', null, 'weighted', 2, 10),
    ('Bench Press', 'Dumbbell Bench Press', 'Flat bench press with dumbbells.', 'equipment', null, 'Dumbbells', null, 'weighted', 2, 20),
    ('Bench Press', 'Incline Barbell Press', 'Incline bench press with a barbell.', 'angle', null, 'Barbell', null, 'weighted', 3, 30)
) as variant(
  exercise_name,
  name,
  description,
  variant_type,
  grip_type,
  equipment,
  assistance_type,
  load_type,
  progression_level,
  sort_order
)
join public.exercises exercise
  on exercise.name = variant.exercise_name
  and exercise.is_builtin = true
where not exists (
  select 1
  from public.exercise_variants existing
  where existing.exercise_id = exercise.id
    and existing.is_builtin = true
    and existing.name = variant.name
);
