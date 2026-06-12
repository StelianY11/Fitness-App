# Database

This project uses Supabase Postgres for user profiles, the shared exercise library, workout templates, workout logs, and body weight history.

## Run Order

Run SQL in this order:

1. `supabase/schema.sql`
2. `supabase/migrations/001_fitness_schema.sql`
3. `supabase/migrations/002_extend_exercises.sql`
4. `supabase/migrations/003_exercise_variants.sql`
5. `supabase/migrations/004_workout_template_engine.sql`
6. `supabase/migrations/005_add_circuit_template_block_type.sql`
7. `supabase/migrations/006_live_workout_foundation.sql`
8. `supabase/migrations/007_profile_prefill_mode.sql`
9. `supabase/seed/001_exercises_seed.sql`
10. `supabase/seed/002_exercise_variants_seed.sql`
11. `supabase/seed/003_canonical_exercises_seed.sql`

The first file sets up the auth profile foundation and allowlist. The first migration creates the fitness tables and RLS policies. The second migration extends exercises for future Gym, Calisthenics, and Street Workout support. The third migration adds exercise variants. The fourth migration adds the block-based workout template engine. The fifth migration adds circuit blocks. The sixth migration adds the live workout logging foundation. The seventh migration adds the live workout pre-fill preference foundation. The seeds insert builtin exercise categories, starter exercises, exercise variants, and canonical imported exercise data.

## Tables

`profiles` stores one profile row per authenticated user. It is private to that user. The optional `pre_fill_mode` preference controls live workout defaults: `LAST_WORKOUT`, `TEMPLATE`, or `EMPTY`.

`exercise_categories` groups exercises by category. Builtin rows have `is_builtin = true` and `owner_id = null`; user-created rows have `owner_id` set to the user.

`exercises` stores the exercise library. Builtin exercises are shared with all authenticated users. User-created exercises are private to the owning user. Exercise classification fields support future training styles such as Gym, Bodyweight, Weighted Bodyweight, Assisted, Hold, Time, Distance, Calisthenics, and Street Workout.

`exercise_variants` stores alternate ways to perform an exercise. Examples include pull-up grip types, push-up variations, weighted or assisted versions, and calisthenics progressions. Builtin variants are shared with authenticated users; custom variants are private to the user who created them.

`workout_templates` stores reusable workout plans. Builtin templates can be shared with authenticated users; personal templates are private to their owner. Template metadata can include a goal, difficulty, and estimated duration.

`workout_template_blocks` stores ordered sections inside a workout template. Blocks can represent normal exercise groups, warmups, supersets, dropsets, giant sets, or note-only sections.

`workout_template_block_exercises` stores ordered exercise prescriptions inside a block. It can reference a base exercise and optionally an exercise variant. Target fields are intentionally flexible for reps, weight, duration, distance, rest, tempo, RIR, and notes.

`workout_template_exercises` is the older flat template exercise table from the initial schema. It remains available for compatibility, but future template features should prefer the block-based `workout_template_blocks` and `workout_template_block_exercises` model.

`workout_sessions` stores a user workout log instance, optionally linked to a template. A session can be `active`, `completed`, or `cancelled`.

`workout_exercises` stores the ordered exercises performed inside a workout session. It is the live workout bridge between a session and its performed sets. It can reference the original template block/exercise and an exercise variant.

`workout_sets` stores every performed set as an individual record. A set can belong directly to a legacy session/exercise pair or, for new live workouts, to a `workout_exercise`. Set fields support reps, weight, assistance, duration, distance, RPE, RIR, tempo, warmups, set type, completion time, and notes.

`body_weight_history` stores private body weight measurements for each user.

## Shared vs Private Data

Shared data:

- Builtin exercise categories
- Builtin exercises
- Builtin exercise variants
- Builtin workout templates, when added later

Private per-user data:

- Profiles
- User-created categories
- User-created exercises
- User-created exercise variants
- User-created templates
- User-created template blocks
- User-created template block exercises
- Workout sessions
- Workout exercises
- Workout sets
- Body weight history

Builtin rows use `is_builtin = true` and `owner_id = null`. Private rows use `owner_id = auth.uid()` or `user_id = auth.uid()`.

## Exercise Classification

`training_type` describes the broad context: `gym`, `calisthenics`, `street_workout`, `cardio`, or `mobility`.

`exercise_type` describes how the exercise is usually performed or measured: `gym`, `bodyweight`, `weighted_bodyweight`, `assisted`, `hold`, `time`, or `distance`.

`progression_group` and `progression_level` can group skills such as push-up, pull-up, dip, squat, or handstand progressions.

`default_unit` describes the expected logging unit: `reps`, `kg`, `seconds`, `minutes`, `meters`, or `kilometers`.

The capability flags `supports_weight`, `supports_assistance`, `supports_duration`, and `supports_distance` tell future UI and workout logging flows what inputs make sense for an exercise.

The starter seed remains valid because these fields are nullable or have conservative defaults.

## Exercise Variants

Variants are attached to a base exercise and describe useful alternatives without duplicating the whole exercise.

Examples:

- Pull-up grips: overhand pull-up, chin-up, neutral-grip pull-up, wide-grip pull-up
- Push-up variations: incline push-up, diamond push-up, archer push-up, deficit push-up
- Weighted or assisted versions: weighted dip, band-assisted pull-up, machine-assisted pull-up
- Calisthenics progressions: tuck front lever, advanced tuck front lever, straddle front lever

`variant_type`, `grip_type`, `equipment`, `assistance_type`, `load_type`, and `progression_level` are intentionally flexible text/number fields for future UI and logging flows.

Builtin variants use `is_builtin = true` and `created_by = null`. Custom variants use `is_builtin = false` and `created_by = auth.uid()`.

## Workout Template Engine

Workout templates now use a three-level structure:

1. `workout_templates`
2. `workout_template_blocks`
3. `workout_template_block_exercises`

Blocks provide the structure for a workout. A normal strength workout might use one block per section. A superset or giant set can keep multiple exercises inside one block so future UI can render them together. A dropset block can contain the main movement plus drop prescriptions. A notes block can store instructions without requiring a specific exercise.

Supported block types:

- `normal`
- `warmup`
- `superset`
- `dropset`
- `giant_set`
- `circuit`
- `notes`

Supported set types inside block exercises:

- `warmup`
- `working`
- `dropset`
- `backoff`
- `failure`
- `note`

The template engine remains separate from live workout history. Live workouts can reference templates through `workout_sessions`, `workout_exercises`, and the optional template reference fields on performed exercises.

## Live Workout Logging

Live workouts use a three-level structure:

1. `workout_sessions`
2. `workout_exercises`
3. `workout_sets`

`workout_sessions` represents the workout as a whole. It tracks the owning user, optional template, status, start time, finish time, and notes.

`workout_exercises` represents one performed movement inside that session. This avoids repeating exercise-level metadata on every set and supports template-derived workouts, custom exercise ordering, variants, and future live workout UI.

`workout_sets` represents each individual performed set. This is the source of truth for training history and future statistics.

Supported performed set types:

- `normal`
- `warmup`
- `dropset`
- `failure`
- `assisted`
- `forced`
- `partial`
- `hold`
- `timed`
- `distance`

Set fields are intentionally broad enough for Gym, Calisthenics, Street Workout, weighted bodyweight, band-assisted work, holds, and cardio:

- Strength: `reps`, `weight_kg`, `rpe`, `rir`, `tempo`
- Assisted work: `assistance_kg`, `assistance_type`
- Holds and timed work: `duration_seconds`
- Cardio and distance work: `distance_meters`
- Warmups and advanced sets: `is_warmup`, `set_type`

For compatibility, `workout_sets.exercise_id` remains in place. New live workout features should also set `workout_exercise_id`.

## RLS Protection

Row Level Security is enabled on all fitness tables.

Authenticated users can read builtin categories, exercises, and templates. For private data, policies require `owner_id = auth.uid()` or `user_id = auth.uid()`.

Nested tables are protected through their parent records. For example, `workout_template_blocks` and `workout_template_block_exercises` are accessible only when the parent template is builtin or owned by the current user. `workout_exercises` and `workout_sets` can be read or modified only when the related `workout_sessions.user_id` matches the current authenticated user.

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
