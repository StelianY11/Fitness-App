-- Phase 4H: Canonical exercise seed
--
-- Generated from tools/exercise-import/output/canonical-exercises.json
-- and tools/exercise-import/output/exercise-aliases.json.
--
-- Review this file before running it in Supabase.
-- This file inserts builtin categories and canonical builtin exercises only.
-- It does not import images, aliases, variants, workout templates, or user data.
-- It is safe to run more than once: inserts are skipped when builtin names already exist.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

insert into public.exercise_categories (name, description, is_builtin)
select category.name, category.description, category.is_builtin
from (
  values
    ('Arms', 'Arms exercise category.', true),
    ('Back', 'Back exercise category.', true),
    ('Cardio', 'Cardio exercise category.', true),
    ('Chest', 'Chest exercise category.', true),
    ('Core', 'Core exercise category.', true),
    ('Legs', 'Legs exercise category.', true),
    ('Shoulders', 'Shoulders exercise category.', true)
) as category(name, description, is_builtin)
where not exists (
  select 1
  from public.exercise_categories existing
  where existing.is_builtin = true
    and existing.name = category.name
);

-- ---------------------------------------------------------------------------
-- Canonical exercises
-- ---------------------------------------------------------------------------

insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Ab Crunch Machine',
  'Ab Crunch Machine for core using Machine',
  'Imported canonical exercise preview for Ab Crunch Machine.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Machine',
  'gym',
  'gym',
  'core_flexion',
  2,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Ab Crunch Machine'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Ab Roller',
  'Ab Roller for core using Other',
  'Imported canonical exercise preview for Ab Roller.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['core', 'shoulders']::text[],
  'Other',
  'gym',
  'gym',
  null,
  2,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Ab Roller'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Air Bike',
  'Air Bike for core using Bodyweight',
  'Imported canonical exercise preview for Air Bike.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  null,
  1,
  'reps',
  false,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Air Bike'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Alternate Hammer Curl',
  'Alternate Hammer Curl for biceps using Dumbbells',
  'Imported canonical exercise preview for Alternate Hammer Curl.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['biceps', 'forearms']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Alternate Hammer Curl'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Alternate Heel Touchers',
  'Alternate Heel Touchers for core using Bodyweight',
  'Imported canonical exercise preview for Alternate Heel Touchers.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  null,
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Alternate Heel Touchers'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Alternate Incline Dumbbell Curl',
  'Alternate Incline Dumbbell Curl for biceps using Dumbbells',
  'Imported canonical exercise preview for Alternate Incline Dumbbell Curl.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['biceps', 'forearms']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Alternate Incline Dumbbell Curl'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Alternating Cable Shoulder Press',
  'Alternating Cable Shoulder Press for shoulders using Cable machine',
  'Imported canonical exercise preview for Alternating Cable Shoulder Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders', 'triceps']::text[],
  'Cable machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Alternating Cable Shoulder Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Alternating Deltoid Raise',
  'Alternating Deltoid Raise for shoulders using Dumbbells',
  'Imported canonical exercise preview for Alternating Deltoid Raise.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Alternating Deltoid Raise'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Alternating Floor Press',
  'Alternating Floor Press for chest using Kettlebell',
  'Imported canonical exercise preview for Alternating Floor Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'core', 'shoulders', 'triceps']::text[],
  'Kettlebell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Alternating Floor Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Anti-Gravity Press',
  'Anti-Gravity Press for shoulders using Barbell',
  'Imported canonical exercise preview for Anti-Gravity Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'shoulders', 'traps', 'triceps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Anti-Gravity Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Curls Lying Against An Incline',
  'Barbell Curls Lying Against An Incline for biceps using Barbell',
  'Imported canonical exercise preview for Barbell Curls Lying Against An Incline.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['biceps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Curls Lying Against An Incline'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Deadlift',
  'Barbell Deadlift for back using Barbell',
  'Imported canonical exercise preview for Barbell Deadlift.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'calves', 'forearms', 'glutes', 'hamstrings', 'quads', 'traps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  2,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Deadlift'
  );
-- Aliases deferred for a later alias/variant phase: Barbell Incline Bench Press - Medium Grip
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Incline Bench Press',
  'Barbell Incline Bench Press for chest using Barbell',
  'Imported canonical exercise preview for Barbell Incline Bench Press.

Difficulty: beginner.

Known aliases: Barbell Incline Bench Press - Medium Grip.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Incline Bench Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Incline Shoulder Raise',
  'Barbell Incline Shoulder Raise for shoulders using Barbell',
  'Imported canonical exercise preview for Barbell Incline Shoulder Raise.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Incline Shoulder Raise'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Rear Delt Row',
  'Barbell Rear Delt Row for shoulders using Barbell',
  'Imported canonical exercise preview for Barbell Rear Delt Row.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'shoulders']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Rear Delt Row'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Seated Calf Raise',
  'Barbell Seated Calf Raise for calves using Barbell',
  'Imported canonical exercise preview for Barbell Seated Calf Raise.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Seated Calf Raise'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Shrug',
  'Barbell Shrug for traps using Barbell',
  'Imported canonical exercise preview for Barbell Shrug.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['traps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Shrug'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Shrug Behind The Back',
  'Barbell Shrug Behind The Back for traps using Barbell',
  'Imported canonical exercise preview for Barbell Shrug Behind The Back.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'forearms', 'traps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Shrug Behind The Back'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Side Bend',
  'Barbell Side Bend for core using Barbell',
  'Imported canonical exercise preview for Barbell Side Bend.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'core']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Side Bend'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Side Split Squat',
  'Barbell Side Split Squat for quads using Barbell',
  'Imported canonical exercise preview for Barbell Side Split Squat.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'calves', 'hamstrings', 'quads']::text[],
  'Barbell',
  'gym',
  'gym',
  'squat',
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Side Split Squat'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Barbell Walking Lunge',
  'Barbell Walking Lunge for quads using Barbell',
  'Imported canonical exercise preview for Barbell Walking Lunge.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Barbell Walking Lunge'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bench Dips',
  'Bench Dips for triceps using Bodyweight',
  'Imported canonical exercise preview for Bench Dips.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Bodyweight',
  'street_workout',
  'bodyweight',
  'dip',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bench Dips'
  );
-- Aliases deferred for a later alias/variant phase: Barbell Bench Press - Medium Grip
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bench Press',
  'Bench Press for chest using Barbell',
  'Imported canonical exercise preview for Bench Press.

Difficulty: beginner.

Known aliases: Barbell Bench Press - Medium Grip.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bench Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent Over Barbell Row',
  'Bent Over Barbell Row for back using Barbell',
  'Imported canonical exercise preview for Bent Over Barbell Row.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'shoulders']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent Over Barbell Row'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent Over Dumbbell Rear Delt Raise With Head On Bench',
  'Bent Over Dumbbell Rear Delt Raise With Head On Bench for shoulders using Dumbbells',
  'Imported canonical exercise preview for Bent Over Dumbbell Rear Delt Raise With Head On Bench.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent Over Dumbbell Rear Delt Raise With Head On Bench'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent Over Low-Pulley Side Lateral',
  'Bent Over Low-Pulley Side Lateral for shoulders using Cable machine',
  'Imported canonical exercise preview for Bent Over Low-Pulley Side Lateral.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'shoulders', 'traps']::text[],
  'Cable machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent Over Low-Pulley Side Lateral'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent Over One-Arm Long Bar Row',
  'Bent Over One-Arm Long Bar Row for back using Barbell',
  'Imported canonical exercise preview for Bent Over One-Arm Long Bar Row.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'traps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent Over One-Arm Long Bar Row'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent Over Two-Dumbbell Row',
  'Bent Over Two-Dumbbell Row for back using Dumbbells',
  'Imported canonical exercise preview for Bent Over Two-Dumbbell Row.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'shoulders']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent Over Two-Dumbbell Row'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent Over Two-Dumbbell Row With Palms In',
  'Bent Over Two-Dumbbell Row With Palms In for back using Dumbbells',
  'Imported canonical exercise preview for Bent Over Two-Dumbbell Row With Palms In.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent Over Two-Dumbbell Row With Palms In'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bent-Knee Hip Raise',
  'Bent-Knee Hip Raise for core using Bodyweight',
  'Imported canonical exercise preview for Bent-Knee Hip Raise.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  null,
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bent-Knee Hip Raise'
  );
-- Aliases deferred for a later alias/variant phase: Barbell Curl
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Biceps Curl',
  'Biceps Curl for biceps using Barbell',
  'Imported canonical exercise preview for Biceps Curl.

Difficulty: beginner.

Known aliases: Barbell Curl.

Detailed coaching instructions should be reviewed before production use.',
  array['biceps', 'forearms']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Biceps Curl'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bicycling',
  'Bicycling for quads using Other',
  'Imported canonical exercise preview for Bicycling.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Other',
  'cardio',
  'distance',
  null,
  1,
  'minutes',
  false,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bicycling'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bicycling, Stationary',
  'Bicycling, Stationary for quads using Machine',
  'Imported canonical exercise preview for Bicycling, Stationary.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  1,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bicycling, Stationary'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Body Tricep Press',
  'Body Tricep Press for triceps using Bodyweight',
  'Imported canonical exercise preview for Body Tricep Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['triceps']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  null,
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Body Tricep Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bodyweight Squat',
  'Bodyweight Squat for quads using Bodyweight',
  'Imported canonical exercise preview for Bodyweight Squat.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['glutes', 'hamstrings', 'quads']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  'squat',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bodyweight Squat'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Bottoms Up',
  'Bottoms Up for core using Bodyweight',
  'Imported canonical exercise preview for Bottoms Up.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  null,
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Bottoms Up'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Cable Crunch',
  'Cable Crunch for core using Cable machine',
  'Imported canonical exercise preview for Cable Crunch.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Cable machine',
  'gym',
  'gym',
  'core_flexion',
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Cable Crunch'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Calf Press',
  'Calf Press for calves using Machine',
  'Imported canonical exercise preview for Calf Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves']::text[],
  'Machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Calf Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Chin-Up',
  'Chin-Up for back using Bodyweight',
  'Imported canonical exercise preview for Chin-Up.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'forearms']::text[],
  'Bodyweight',
  'street_workout',
  'bodyweight',
  'pull_up',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Chin-Up'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Close-Grip Barbell Bench Press',
  'Close-Grip Barbell Bench Press for triceps using Barbell',
  'Imported canonical exercise preview for Close-Grip Barbell Bench Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Close-Grip Barbell Bench Press'
  );
-- Aliases deferred for a later alias/variant phase: Crunches
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Crunch',
  'Crunch for core using Bodyweight',
  'Imported canonical exercise preview for Crunch.

Difficulty: beginner.

Known aliases: Crunches.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  'core_flexion',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Crunch'
  );
-- Aliases deferred for a later alias/variant phase: Dips - Chest Version, Dips - Triceps Version
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Dips',
  'Dips for triceps using Bodyweight',
  'Imported canonical exercise preview for Dips.

Difficulty: beginner.

Known aliases: Dips - Chest Version, Dips - Triceps Version.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Bodyweight',
  'gym',
  'bodyweight',
  'dip',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Dips'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Dumbbell Bench Press',
  'Dumbbell Bench Press for chest using Dumbbells',
  'Imported canonical exercise preview for Dumbbell Bench Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Dumbbell Bench Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Dumbbell Flyes',
  'Dumbbell Flyes for chest using Dumbbells',
  'Imported canonical exercise preview for Dumbbell Flyes.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Dumbbell Flyes'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Dumbbell Lunges',
  'Dumbbell Lunges for quads using Dumbbells',
  'Imported canonical exercise preview for Dumbbell Lunges.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Dumbbell Lunges'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Dumbbell Shoulder Press',
  'Dumbbell Shoulder Press for shoulders using Dumbbells',
  'Imported canonical exercise preview for Dumbbell Shoulder Press.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders', 'triceps']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  2,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Dumbbell Shoulder Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Elliptical Trainer',
  'Elliptical Trainer for quads using Machine',
  'Imported canonical exercise preview for Elliptical Trainer.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  2,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Elliptical Trainer'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Exercise Ball Crunch',
  'Exercise Ball Crunch for core using Exercise ball',
  'Imported canonical exercise preview for Exercise Ball Crunch.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Exercise ball',
  'gym',
  'gym',
  'core_flexion',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Exercise Ball Crunch'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Flat Bench Leg Pull-In',
  'Flat Bench Leg Pull-In for core using Bodyweight',
  'Imported canonical exercise preview for Flat Bench Leg Pull-In.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'street_workout',
  'bodyweight',
  'pull_up',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Flat Bench Leg Pull-In'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Front Dumbbell Raise',
  'Front Dumbbell Raise for shoulders using Dumbbells',
  'Imported canonical exercise preview for Front Dumbbell Raise.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Front Dumbbell Raise'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Goblet Squat',
  'Goblet Squat for quads using Kettlebell',
  'Imported canonical exercise preview for Goblet Squat.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads', 'shoulders']::text[],
  'Kettlebell',
  'gym',
  'gym',
  'squat',
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Goblet Squat'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Hammer Curls',
  'Hammer Curls for biceps using Dumbbells',
  'Imported canonical exercise preview for Hammer Curls.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['biceps']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Hammer Curls'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Hanging Leg Raise',
  'Hanging Leg Raise for core using Bodyweight',
  'Imported canonical exercise preview for Hanging Leg Raise.

Difficulty: expert.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  null,
  3,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Hanging Leg Raise'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Incline Dumbbell Press',
  'Incline Dumbbell Press for chest using Dumbbells',
  'Imported canonical exercise preview for Incline Dumbbell Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Incline Dumbbell Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Jogging, Treadmill',
  'Jogging, Treadmill for quads using Machine',
  'Imported canonical exercise preview for Jogging, Treadmill.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  1,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Jogging, Treadmill'
  );
-- Aliases deferred for a later alias/variant phase: Wide-Grip Lat Pulldown
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Lat Pulldown',
  'Lat Pulldown for back using Cable machine',
  'Imported canonical exercise preview for Lat Pulldown.

Difficulty: beginner.

Known aliases: Wide-Grip Lat Pulldown.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'shoulders']::text[],
  'Cable machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Lat Pulldown'
  );
-- Aliases deferred for a later alias/variant phase: Side Lateral Raise
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Lateral Raise',
  'Lateral Raise for shoulders using Dumbbells',
  'Imported canonical exercise preview for Lateral Raise.

Difficulty: beginner.

Known aliases: Side Lateral Raise.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Lateral Raise'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Leg Extensions',
  'Leg Extensions for quads using Machine',
  'Imported canonical exercise preview for Leg Extensions.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['quads']::text[],
  'Machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Leg Extensions'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Leg Press',
  'Leg Press for quads using Machine',
  'Imported canonical exercise preview for Leg Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Leg Press'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Lying Leg Curls',
  'Lying Leg Curls for hamstrings using Machine',
  'Imported canonical exercise preview for Lying Leg Curls.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['hamstrings']::text[],
  'Machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Lying Leg Curls'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Mountain Climbers',
  'Mountain Climbers for quads using None',
  'Imported canonical exercise preview for Mountain Climbers.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'hamstrings', 'quads', 'shoulders']::text[],
  'None',
  'gym',
  'gym',
  null,
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Mountain Climbers'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'One-Arm Dumbbell Row',
  'One-Arm Dumbbell Row for back using Dumbbells',
  'Imported canonical exercise preview for One-Arm Dumbbell Row.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'shoulders']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'One-Arm Dumbbell Row'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Plank',
  'Plank for core using Bodyweight',
  'Imported canonical exercise preview for Plank.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'hold',
  'plank',
  1,
  'seconds',
  false,
  false,
  true,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Plank'
  );
-- Aliases deferred for a later alias/variant phase: Pullups
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Pull Up',
  'Pull Up for back using Bodyweight',
  'Imported canonical exercise preview for Pull Up.

Difficulty: beginner.

Known aliases: Pullups.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps']::text[],
  'Bodyweight',
  'street_workout',
  'bodyweight',
  'pull_up',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Pull Up'
  );
-- Aliases deferred for a later alias/variant phase: Pushups
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Push Up',
  'Push Up for chest using Bodyweight',
  'Imported canonical exercise preview for Push Up.

Difficulty: beginner.

Known aliases: Pushups.

Detailed coaching instructions should be reviewed before production use.',
  array['chest', 'shoulders', 'triceps']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  'push_up',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Chest'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Push Up'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Recumbent Bike',
  'Recumbent Bike for quads using Machine',
  'Imported canonical exercise preview for Recumbent Bike.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  1,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Recumbent Bike'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Romanian Deadlift',
  'Romanian Deadlift for hamstrings using Barbell',
  'Imported canonical exercise preview for Romanian Deadlift.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'calves', 'glutes', 'hamstrings']::text[],
  'Barbell',
  'gym',
  'gym',
  null,
  2,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Romanian Deadlift'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Rowing, Stationary',
  'Rowing, Stationary for quads using Machine',
  'Imported canonical exercise preview for Rowing, Stationary.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  2,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Rowing, Stationary'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Running, Treadmill',
  'Running, Treadmill for quads using Machine',
  'Imported canonical exercise preview for Running, Treadmill.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  1,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Running, Treadmill'
  );
-- Aliases deferred for a later alias/variant phase: Seated Cable Rows
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Seated Cable Row',
  'Seated Cable Row for back using Cable machine',
  'Imported canonical exercise preview for Seated Cable Row.

Difficulty: beginner.

Known aliases: Seated Cable Rows.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'biceps', 'shoulders']::text[],
  'Cable machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Back'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Seated Cable Row'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Seated Dumbbell Press',
  'Seated Dumbbell Press for shoulders using Dumbbells',
  'Imported canonical exercise preview for Seated Dumbbell Press.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['shoulders', 'triceps']::text[],
  'Dumbbells',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Shoulders'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Seated Dumbbell Press'
  );
-- Aliases deferred for a later alias/variant phase: 3/4 Sit-Up
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Sit Up',
  'Sit Up for core using Bodyweight',
  'Imported canonical exercise preview for Sit Up.

Difficulty: beginner.

Known aliases: 3/4 Sit-Up.

Detailed coaching instructions should be reviewed before production use.',
  array['core']::text[],
  'Bodyweight',
  'calisthenics',
  'bodyweight',
  'core_flexion',
  1,
  'reps',
  false,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Core'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Sit Up'
  );
-- Aliases deferred for a later alias/variant phase: Barbell Full Squat, Barbell Squat
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Squat',
  'Squat for quads using Barbell',
  'Imported canonical exercise preview for Squat.

Difficulty: intermediate.

Known aliases: Barbell Full Squat, Barbell Squat.

Detailed coaching instructions should be reviewed before production use.',
  array['back', 'calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Barbell',
  'gym',
  'gym',
  'squat',
  2,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Squat'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Stairmaster',
  'Stairmaster for quads using Machine',
  'Imported canonical exercise preview for Stairmaster.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  2,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Stairmaster'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Standing Calf Raises',
  'Standing Calf Raises for calves using Machine',
  'Imported canonical exercise preview for Standing Calf Raises.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves']::text[],
  'Machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Legs'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Standing Calf Raises'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Step Mill',
  'Step Mill for quads using Machine',
  'Imported canonical exercise preview for Step Mill.

Difficulty: intermediate.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  2,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Step Mill'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Triceps Pushdown',
  'Triceps Pushdown for triceps using Cable machine',
  'Imported canonical exercise preview for Triceps Pushdown.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['triceps']::text[],
  'Cable machine',
  'gym',
  'gym',
  null,
  1,
  'reps',
  true,
  false,
  false,
  false,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Arms'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Triceps Pushdown'
  );
insert into public.exercises (
  category_id,
  owner_id,
  name,
  description,
  instructions,
  muscle_groups,
  equipment,
  training_type,
  exercise_type,
  progression_group,
  progression_level,
  default_unit,
  supports_weight,
  supports_assistance,
  supports_duration,
  supports_distance,
  is_builtin
)
select
  category.id,
  null,
  'Walking, Treadmill',
  'Walking, Treadmill for quads using Machine',
  'Imported canonical exercise preview for Walking, Treadmill.

Difficulty: beginner.

Detailed coaching instructions should be reviewed before production use.',
  array['calves', 'glutes', 'hamstrings', 'quads']::text[],
  'Machine',
  'cardio',
  'distance',
  null,
  1,
  'minutes',
  true,
  false,
  true,
  true,
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = 'Cardio'
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = 'Walking, Treadmill'
  );
