-- Phase 3B: Starter exercise seed
--
-- Run after supabase/migrations/001_fitness_schema.sql.
-- This seed is safe to run more than once: inserts are skipped when a builtin
-- category or exercise with the same name already exists.

insert into public.exercise_categories (name, description, is_builtin)
select category.name, category.description, true
from (
  values
    ('Chest', 'Chest-focused strength movements.'),
    ('Back', 'Back and pulling movements.'),
    ('Legs', 'Lower-body strength movements.'),
    ('Shoulders', 'Shoulder-focused movements.'),
    ('Arms', 'Biceps and triceps movements.'),
    ('Core', 'Abdominal and trunk stability movements.'),
    ('Cardio', 'Conditioning and endurance movements.')
) as category(name, description)
where not exists (
  select 1
  from public.exercise_categories existing
  where existing.is_builtin = true
    and existing.name = category.name
);

insert into public.exercises (category_id, name, description, muscle_groups, equipment, is_builtin)
select category.id, exercise.name, exercise.description, exercise.muscle_groups, exercise.equipment, true
from (
  values
    ('Chest', 'Push-Up', 'Bodyweight chest press from the floor.', array['chest', 'triceps', 'shoulders'], 'Bodyweight'),
    ('Chest', 'Bench Press', 'Barbell press from a flat bench.', array['chest', 'triceps', 'shoulders'], 'Barbell'),
    ('Chest', 'Dumbbell Fly', 'Chest isolation with a wide arc.', array['chest'], 'Dumbbells'),

    ('Back', 'Pull-Up', 'Bodyweight vertical pulling movement.', array['back', 'biceps'], 'Pull-up bar'),
    ('Back', 'Bent-Over Row', 'Hip-hinged row for upper back strength.', array['back', 'biceps'], 'Barbell'),
    ('Back', 'Lat Pulldown', 'Cable vertical pull for the lats.', array['back', 'biceps'], 'Cable machine'),

    ('Legs', 'Squat', 'Compound lower-body strength movement.', array['quads', 'glutes', 'hamstrings'], 'Barbell'),
    ('Legs', 'Romanian Deadlift', 'Hip hinge for hamstrings and glutes.', array['hamstrings', 'glutes', 'back'], 'Barbell'),
    ('Legs', 'Walking Lunge', 'Single-leg stepping strength movement.', array['quads', 'glutes', 'hamstrings'], 'Bodyweight'),

    ('Shoulders', 'Overhead Press', 'Vertical press for shoulder strength.', array['shoulders', 'triceps'], 'Barbell'),
    ('Shoulders', 'Lateral Raise', 'Side delt isolation raise.', array['shoulders'], 'Dumbbells'),
    ('Shoulders', 'Face Pull', 'Rear delt and upper back cable pull.', array['shoulders', 'upper back'], 'Cable machine'),

    ('Arms', 'Biceps Curl', 'Classic elbow flexion movement.', array['biceps'], 'Dumbbells'),
    ('Arms', 'Triceps Pushdown', 'Cable triceps isolation movement.', array['triceps'], 'Cable machine'),
    ('Arms', 'Hammer Curl', 'Neutral-grip curl for arms and forearms.', array['biceps', 'forearms'], 'Dumbbells'),

    ('Core', 'Plank', 'Static trunk stability hold.', array['core'], 'Bodyweight'),
    ('Core', 'Dead Bug', 'Controlled core stability drill.', array['core'], 'Bodyweight'),
    ('Core', 'Hanging Knee Raise', 'Hip flexion core movement.', array['core', 'hip flexors'], 'Pull-up bar'),

    ('Cardio', 'Running', 'Steady-state or interval running.', array['cardio', 'legs'], 'None'),
    ('Cardio', 'Cycling', 'Low-impact endurance conditioning.', array['cardio', 'legs'], 'Bike'),
    ('Cardio', 'Jump Rope', 'Rhythm-based conditioning movement.', array['cardio', 'calves'], 'Jump rope')
) as exercise(category_name, name, description, muscle_groups, equipment)
join public.exercise_categories category
  on category.name = exercise.category_name
  and category.is_builtin = true
where not exists (
  select 1
  from public.exercises existing
  where existing.is_builtin = true
    and existing.name = exercise.name
);
