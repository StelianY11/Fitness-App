# Database

This project uses Supabase Postgres for user profiles, the shared exercise library, workout templates, workout logs, and body weight history.

## Run Order

Run SQL in this order:

1. `supabase/schema.sql`
2. `supabase/migrations/001_fitness_schema.sql`
3. `supabase/seed/001_exercises_seed.sql`

The first file sets up the auth profile foundation and allowlist. The migration creates the fitness tables and RLS policies. The seed inserts builtin exercise categories and starter exercises.

## Tables

`profiles` stores one profile row per authenticated user. It is private to that user.

`exercise_categories` groups exercises by category. Builtin rows have `is_builtin = true` and `owner_id = null`; user-created rows have `owner_id` set to the user.

`exercises` stores the exercise library. Builtin exercises are shared with all authenticated users. User-created exercises are private to the owning user.

`workout_templates` stores reusable workout plans. Builtin templates can be shared with authenticated users; personal templates are private to their owner.

`workout_template_exercises` stores the ordered exercises inside a template, including target sets, reps, rest time, and notes.

`workout_sessions` stores a user workout log instance, optionally linked to a template.

`workout_sets` stores the sets performed during a workout session, including reps, weight, duration, distance, completion time, and notes.

`body_weight_history` stores private body weight measurements for each user.

## Shared vs Private Data

Shared data:

- Builtin exercise categories
- Builtin exercises
- Builtin workout templates, when added later

Private per-user data:

- Profiles
- User-created categories
- User-created exercises
- User-created templates
- Workout sessions
- Workout sets
- Body weight history

Builtin rows use `is_builtin = true` and `owner_id = null`. Private rows use `owner_id = auth.uid()` or `user_id = auth.uid()`.

## RLS Protection

Row Level Security is enabled on all fitness tables.

Authenticated users can read builtin categories, exercises, and templates. For private data, policies require `owner_id = auth.uid()` or `user_id = auth.uid()`.

Nested tables are protected through their parent records. For example, `workout_sets` can be read or modified only when the related `workout_sessions.user_id` matches the current authenticated user.

Frontend route guards are only UX. RLS is the database security layer.

## Verifying Seed Data

After running the seed:

1. Open Supabase.
2. Go to Table Editor.
3. Open `exercise_categories`.
4. Confirm these builtin categories exist: Chest, Back, Legs, Shoulders, Arms, Core, Cardio.
5. Open `exercises`.
6. Filter `is_builtin = true`.
7. Confirm there are at least 21 starter exercises, with 3 per category.

The seed uses `where not exists` checks, so rerunning it should skip existing builtin category and exercise names instead of duplicating them.
