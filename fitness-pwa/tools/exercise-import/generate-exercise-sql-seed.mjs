import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('tools/exercise-import/output');
const CANONICAL_PATH = path.join(OUTPUT_DIR, 'canonical-exercises.json');
const ALIASES_PATH = path.join(OUTPUT_DIR, 'exercise-aliases.json');
const SQL_OUTPUT_PATH = path.resolve('supabase/seed/003_canonical_exercises_seed.sql');

const canonicalExercises = JSON.parse(await readFile(CANONICAL_PATH, 'utf8'));
const aliases = JSON.parse(await readFile(ALIASES_PATH, 'utf8'));

if (!Array.isArray(canonicalExercises)) {
  throw new Error(`Expected ${CANONICAL_PATH} to contain a JSON array.`);
}

if (!Array.isArray(aliases)) {
  throw new Error(`Expected ${ALIASES_PATH} to contain a JSON array.`);
}

const categories = [...new Set(canonicalExercises.map((exercise) => exercise.categoryName).filter(Boolean))]
  .sort((left, right) => left.localeCompare(right));

const aliasesByCanonicalName = aliases.reduce((map, alias) => {
  const list = map.get(alias.canonicalName) ?? [];
  list.push(alias.alias);
  map.set(alias.canonicalName, list);
  return map;
}, new Map());

const sql = [
  '-- Phase 4H: Canonical exercise seed',
  '--',
  '-- Generated from tools/exercise-import/output/canonical-exercises.json',
  '-- and tools/exercise-import/output/exercise-aliases.json.',
  '--',
  '-- Review this file before running it in Supabase.',
  '-- This file inserts builtin categories and canonical builtin exercises only.',
  '-- It does not import images, aliases, variants, workout templates, or user data.',
  '-- It is safe to run more than once: inserts are skipped when builtin names already exist.',
  '',
  '-- ---------------------------------------------------------------------------',
  '-- Categories',
  '-- ---------------------------------------------------------------------------',
  '',
  buildCategoryInsert(categories),
  '',
  '-- ---------------------------------------------------------------------------',
  '-- Canonical exercises',
  '-- ---------------------------------------------------------------------------',
  '',
  ...canonicalExercises.map((exercise) => buildExerciseInsert(exercise, aliasesByCanonicalName.get(exercise.canonicalName) ?? [])),
].join('\n');

await writeFile(SQL_OUTPUT_PATH, `${sql}\n`, 'utf8');

console.log(`Generated ${canonicalExercises.length} canonical exercise inserts.`);
console.log(`SQL seed written to ${SQL_OUTPUT_PATH}`);

function buildCategoryInsert(categoryNames) {
  const values = categoryNames
    .map((categoryName) => `    (${sqlString(categoryName)}, ${sqlString(`${categoryName} exercise category.`)}, true)`)
    .join(',\n');

  return `insert into public.exercise_categories (name, description, is_builtin)
select category.name, category.description, category.is_builtin
from (
  values
${values}
) as category(name, description, is_builtin)
where not exists (
  select 1
  from public.exercise_categories existing
  where existing.is_builtin = true
    and existing.name = category.name
);`;
}

function buildExerciseInsert(exercise, exerciseAliases) {
  const aliasComment = exerciseAliases.length > 0
    ? `-- Aliases deferred for a later alias/variant phase: ${exerciseAliases.join(', ')}\n`
    : '';
  const equipment = chooseFirst(exercise.equipmentOptions) ?? 'None';
  const trainingType = chooseFirst(exercise.trainingTypes);
  const exerciseType = chooseFirst(exercise.exerciseTypes);

  return `${aliasComment}insert into public.exercises (
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
  ${sqlString(exercise.canonicalName)},
  ${sqlString(buildDescription(exercise))},
  ${sqlString(buildInstructions(exercise, exerciseAliases))},
  ${sqlArray(exercise.muscleGroups)},
  ${sqlString(equipment)},
  ${sqlNullableString(trainingType)},
  ${sqlNullableString(exerciseType)},
  ${sqlNullableString(inferProgressionGroup(exercise))},
  ${sqlNullableNumber(inferProgressionLevel(exercise))},
  ${sqlNullableString(exercise.defaultUnit)},
  ${sqlBoolean(inferSupportsWeight(exercise))},
  ${sqlBoolean(inferSupportsAssistance(exercise))},
  ${sqlBoolean(inferSupportsDuration(exercise))},
  ${sqlBoolean(inferSupportsDistance(exercise))},
  true
from public.exercise_categories category
where category.is_builtin = true
  and category.name = ${sqlString(exercise.categoryName)}
  and not exists (
    select 1
    from public.exercises existing
    where existing.is_builtin = true
      and existing.name = ${sqlString(exercise.canonicalName)}
  );`;
}

function buildDescription(exercise) {
  const equipment = chooseFirst(exercise.equipmentOptions);
  const muscle = exercise.primaryMuscle ?? chooseFirst(exercise.muscleGroups);

  return [exercise.canonicalName, muscle ? `for ${muscle}` : null, equipment ? `using ${equipment}` : null]
    .filter(Boolean)
    .join(' ');
}

function buildInstructions(exercise, exerciseAliases) {
  const lines = [
    `Imported canonical exercise preview for ${exercise.canonicalName}.`,
    `Difficulty: ${exercise.difficulty}.`,
  ];

  if (exerciseAliases.length > 0) {
    lines.push(`Known aliases: ${exerciseAliases.join(', ')}.`);
  }

  lines.push('Detailed coaching instructions should be reviewed before production use.');

  return lines.join('\n\n');
}

function inferProgressionGroup(exercise) {
  const name = exercise.canonicalName.toLowerCase();

  if (/\bpush\b|\bpush up\b/.test(name)) return 'push_up';
  if (/\bpull\b|\bpull up\b|\bchin\b|\bchin up\b/.test(name)) return 'pull_up';
  if (/\bdip\b|\bdips\b/.test(name)) return 'dip';
  if (/\bsquat\b/.test(name)) return 'squat';
  if (/\bplank\b|\bbridge\b/.test(name)) return 'plank';
  if (/\bsit up\b|\bcrunch\b|\bcrunches\b/.test(name)) return 'core_flexion';

  return null;
}

function inferProgressionLevel(exercise) {
  if (exercise.difficulty === 'beginner') return 1;
  if (exercise.difficulty === 'intermediate') return 2;
  if (exercise.difficulty === 'expert') return 3;
  return null;
}

function inferSupportsWeight(exercise) {
  return exercise.equipmentOptions.some((equipment) =>
    ['Barbell', 'Dumbbells', 'Kettlebell', 'Cable machine', 'Machine', 'E-Z curl bar'].includes(equipment),
  );
}

function inferSupportsAssistance(exercise) {
  return exercise.equipmentOptions.includes('Resistance bands') || /assist|band/i.test(exercise.canonicalName);
}

function inferSupportsDuration(exercise) {
  return exercise.exerciseTypes.includes('hold') || exercise.trainingTypes.includes('cardio');
}

function inferSupportsDistance(exercise) {
  return exercise.exerciseTypes.includes('distance') || /\b(run|running|walk|walking|sprint|bike|cycling|row|rowing)\b/i.test(exercise.canonicalName);
}

function chooseFirst(values) {
  return values.find((value) => value !== null && value !== undefined) ?? null;
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlNullableString(value) {
  return value === null || value === undefined ? 'null' : sqlString(value);
}

function sqlNullableNumber(value) {
  return value === null || value === undefined ? 'null' : String(value);
}

function sqlBoolean(value) {
  return value ? 'true' : 'false';
}

function sqlArray(values) {
  const items = values.map((value) => sqlString(value)).join(', ');
  return `array[${items}]::text[]`;
}
