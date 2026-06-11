import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('tools/exercise-import/output');
const PREVIEW_PATH = path.join(OUTPUT_DIR, 'exercises-preview.json');
const SKIPPED_PATH = path.join(OUTPUT_DIR, 'skipped-exercises.json');
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'import-summary.md');
const TARGET_BATCH_SIZE = 80;

const preferredNames = new Set([
  '3/4 Sit-Up',
  'Ab Crunch Machine',
  'Ab Roller',
  'Air Bike',
  'Alternate Hammer Curl',
  'Barbell Bench Press - Medium Grip',
  'Barbell Curl',
  'Barbell Deadlift',
  'Barbell Full Squat',
  'Barbell Incline Bench Press Medium-Grip',
  'Bent Over Barbell Row',
  'Bodyweight Squat',
  'Burpee',
  'Cable Crunch',
  'Cable Seated Row',
  'Calf Press',
  'Chin-Up',
  'Close-Grip Barbell Bench Press',
  'Crunches',
  'Dips - Chest Version',
  'Dips - Triceps Version',
  'Dumbbell Bench Press',
  'Dumbbell Flyes',
  'Dumbbell Lunges',
  'Dumbbell Shoulder Press',
  'Exercise Ball Crunch',
  'Flat Bench Leg Pull-In',
  'Front Dumbbell Raise',
  'Goblet Squat',
  'Hammer Curls',
  'Hanging Leg Raise',
  'Incline Dumbbell Press',
  'Jumping Rope',
  'Kettlebell Deadlift',
  'Lat Pulldown',
  'Leg Extensions',
  'Leg Press',
  'Lying Leg Curls',
  'Mountain Climbers',
  'One-Arm Dumbbell Row',
  'Plank',
  'Pullups',
  'Pushups',
  'Romanian Deadlift',
  'Running, Treadmill',
  'Seated Cable Rows',
  'Seated Dumbbell Press',
  'Side Bridge',
  'Side Lateral Raise',
  'Standing Calf Raises',
  'Triceps Pushdown',
  'Wide-Grip Lat Pulldown',
]);

const usefulCategories = new Set(['strength', 'cardio', 'plyometrics', 'powerlifting']);
const nicheCategoryPenalty = new Set(['stretching', 'strongman', 'olympic weightlifting']);
const problematicNamePatterns = [
  /partner/i,
  /\bsmr\b/i,
  /massage/i,
  /stretch/i,
  /clean from blocks/i,
  /snatch/i,
  /atlas/i,
  /yoke/i,
  /log lift/i,
  /neck/i,
];

function usage() {
  console.error('Usage: npm.cmd run preview:exercises -- path/to/free-exercise-db/dist/exercises.json');
}

const inputPath = process.argv[2];

if (!inputPath) {
  usage();
  process.exit(1);
}

const raw = await readFile(path.resolve(inputPath), 'utf8');
const sourceExercises = JSON.parse(raw);

if (!Array.isArray(sourceExercises)) {
  throw new Error('Expected free-exercise-db dist/exercises.json to contain a JSON array.');
}

const skipped = [];
const seenNames = new Set();
const candidates = [];

for (const source of sourceExercises) {
  const validationIssue = getValidationIssue(source);

  if (validationIssue) {
    skipped.push(toSkipped(source, validationIssue));
    continue;
  }

  const normalizedName = source.name.trim().toLowerCase();

  if (seenNames.has(normalizedName)) {
    skipped.push(toSkipped(source, 'duplicate exercise name'));
    continue;
  }

  seenNames.add(normalizedName);

  const skipReason = getSkipReason(source);

  if (skipReason) {
    skipped.push(toSkipped(source, skipReason));
    continue;
  }

  candidates.push({
    score: scoreExercise(source),
    exercise: normalizeExercise(source),
  });
}

const selected = candidates
  .sort((left, right) => right.score - left.score || left.exercise.name.localeCompare(right.exercise.name))
  .slice(0, TARGET_BATCH_SIZE)
  .map((candidate) => candidate.exercise);

const selectedSourceIds = new Set(selected.map((exercise) => exercise.sourceId));

for (const candidate of candidates) {
  if (!selectedSourceIds.has(candidate.exercise.sourceId)) {
    skipped.push({
      id: candidate.exercise.sourceId,
      name: candidate.exercise.name,
      reason: 'outside curated first batch',
    });
  }
}

await mkdir(OUTPUT_DIR, { recursive: true });
await writeJson(PREVIEW_PATH, selected);
await writeJson(SKIPPED_PATH, skipped);
await writeFile(SUMMARY_PATH, buildSummary(sourceExercises.length, selected, skipped), 'utf8');

console.log(`Preview written to ${PREVIEW_PATH}`);
console.log(`Skipped report written to ${SKIPPED_PATH}`);
console.log(`Summary written to ${SUMMARY_PATH}`);

function getValidationIssue(source) {
  if (!source || typeof source !== 'object') {
    return 'record is not an object';
  }

  if (!source.id || !source.name) {
    return 'missing id or name';
  }

  if (!Array.isArray(source.primaryMuscles) || source.primaryMuscles.length === 0) {
    return 'missing primary muscles';
  }

  if (!Array.isArray(source.instructions) || source.instructions.length === 0) {
    return 'missing instructions';
  }

  return null;
}

function getSkipReason(source) {
  if (problematicNamePatterns.some((pattern) => pattern.test(source.name))) {
    return 'unclear, overly niche, or not suitable for first batch';
  }

  if (nicheCategoryPenalty.has(source.category) && !preferredNames.has(source.name)) {
    return 'category deferred from first batch';
  }

  if (source.equipment === 'foam roll') {
    return 'recovery/self-myofascial release deferred';
  }

  return null;
}

function scoreExercise(source) {
  let score = 0;

  if (preferredNames.has(source.name)) {
    score += 100;
  }

  if (usefulCategories.has(source.category)) {
    score += 20;
  }

  if (source.level === 'beginner') {
    score += 12;
  } else if (source.level === 'intermediate') {
    score += 8;
  }

  if (['barbell', 'dumbbell', 'body only', 'cable', 'machine', 'kettlebells'].includes(source.equipment)) {
    score += 10;
  }

  if (source.category === 'cardio') {
    score += 10;
  }

  if (source.primaryMuscles.length === 1) {
    score += 4;
  }

  if ((source.instructions?.length ?? 0) > 8) {
    score -= 4;
  }

  return score;
}

function normalizeExercise(source) {
  const equipment = normalizeEquipment(source.equipment);
  const trainingType = inferTrainingType(source);
  const exerciseType = inferExerciseType(source);
  const primaryMuscle = normalizeMuscle(source.primaryMuscles[0]);
  const secondaryMuscles = (source.secondaryMuscles ?? []).map(normalizeMuscle);

  return {
    source: 'yuhonas/free-exercise-db',
    sourceId: source.id,
    name: source.name,
    categoryName: mapCategoryName(primaryMuscle, source.category),
    primaryMuscle,
    secondaryMuscles,
    muscleGroups: unique([primaryMuscle, ...secondaryMuscles]),
    equipment,
    difficulty: source.level,
    description: summarizeInstructions(source.instructions),
    instructions: source.instructions.join('\n\n'),
    imagePaths: source.images ?? [],
    trainingType,
    exerciseType,
    progressionGroup: inferProgressionGroup(source.name),
    progressionLevel: mapProgressionLevel(source.level),
    defaultUnit: inferDefaultUnit(source, exerciseType),
    supportsWeight: supportsWeight(source),
    supportsAssistance: supportsAssistance(source),
    supportsDuration: supportsDuration(source, exerciseType),
    supportsDistance: supportsDistance(source),
    importNotes: buildImportNotes(source),
  };
}

function normalizeEquipment(equipment) {
  const map = {
    'body only': 'Bodyweight',
    barbell: 'Barbell',
    dumbbell: 'Dumbbells',
    kettlebells: 'Kettlebell',
    cable: 'Cable machine',
    machine: 'Machine',
    bands: 'Resistance bands',
    'medicine ball': 'Medicine ball',
    'exercise ball': 'Exercise ball',
    'e-z curl bar': 'E-Z curl bar',
    other: 'Other',
  };

  return equipment ? map[equipment] ?? titleCase(equipment) : 'None';
}

function normalizeMuscle(muscle) {
  const map = {
    abdominals: 'core',
    lats: 'back',
    'middle back': 'back',
    'lower back': 'back',
    quadriceps: 'quads',
  };

  return map[muscle] ?? muscle;
}

function mapCategoryName(primaryMuscle, sourceCategory) {
  if (sourceCategory === 'cardio') {
    return 'Cardio';
  }

  if (['chest'].includes(primaryMuscle)) {
    return 'Chest';
  }

  if (['back', 'lats', 'traps', 'lower back', 'middle back'].includes(primaryMuscle)) {
    return 'Back';
  }

  if (['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'].includes(primaryMuscle)) {
    return 'Legs';
  }

  if (primaryMuscle === 'shoulders') {
    return 'Shoulders';
  }

  if (['biceps', 'triceps', 'forearms'].includes(primaryMuscle)) {
    return 'Arms';
  }

  if (primaryMuscle === 'core') {
    return 'Core';
  }

  return 'Core';
}

function inferTrainingType(source) {
  if (source.category === 'cardio') {
    return 'cardio';
  }

  if (source.category === 'stretching') {
    return 'mobility';
  }

  if (source.equipment === 'body only') {
    return isStreetWorkoutName(source.name) ? 'street_workout' : 'calisthenics';
  }

  return 'gym';
}

function inferExerciseType(source) {
  if (source.force === 'static') {
    return 'hold';
  }

  if (source.category === 'cardio') {
    return 'distance';
  }

  if (source.equipment === 'body only') {
    return 'bodyweight';
  }

  if (source.equipment === 'bands') {
    return 'assisted';
  }

  return 'gym';
}

function inferDefaultUnit(source, exerciseType) {
  if (exerciseType === 'hold') {
    return 'seconds';
  }

  if (source.category === 'cardio') {
    return 'minutes';
  }

  return 'reps';
}

function supportsWeight(source) {
  return ['barbell', 'dumbbell', 'kettlebells', 'cable', 'machine', 'e-z curl bar'].includes(source.equipment);
}

function supportsAssistance(source) {
  return source.equipment === 'bands' || /assist|band/i.test(source.name);
}

function supportsDuration(source, exerciseType) {
  return exerciseType === 'hold' || source.category === 'cardio' || source.category === 'stretching';
}

function supportsDistance(source) {
  return source.category === 'cardio' || /run|walk|sprint|bike|cycling|row/i.test(source.name);
}

function inferProgressionGroup(name) {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('push')) return 'push_up';
  if (lowerName.includes('pull') || lowerName.includes('chin')) return 'pull_up';
  if (lowerName.includes('dip')) return 'dip';
  if (lowerName.includes('squat')) return 'squat';
  if (lowerName.includes('plank') || lowerName.includes('bridge')) return 'plank';
  if (lowerName.includes('sit-up') || lowerName.includes('crunch')) return 'core_flexion';

  return null;
}

function mapProgressionLevel(level) {
  if (level === 'beginner') return 1;
  if (level === 'intermediate') return 2;
  if (level === 'expert') return 3;
  return null;
}

function summarizeInstructions(instructions) {
  const first = instructions.find((instruction) => instruction.trim().length > 0) ?? '';
  const clean = first.replace(/\s+/g, ' ').trim();
  return clean.length > 180 ? `${clean.slice(0, 177)}...` : clean;
}

function buildImportNotes(source) {
  const notes = [];

  if (source.mechanic === null) notes.push('missing mechanic');
  if (source.equipment === null) notes.push('missing equipment');
  if (source.force === null) notes.push('missing force');
  if ((source.images ?? []).length > 0) notes.push('images referenced, not imported');

  return notes;
}

function isStreetWorkoutName(name) {
  return /pull|chin|dip|muscle|handstand|lever|planche|bar/i.test(name);
}

function toSkipped(source, reason) {
  return {
    id: source?.id ?? null,
    name: source?.name ?? null,
    category: source?.category ?? null,
    equipment: source?.equipment ?? null,
    reason,
  };
}

function buildSummary(totalCount, selected, skipped) {
  const byCategory = countBy(selected, (exercise) => exercise.categoryName);
  const byTrainingType = countBy(selected, (exercise) => exercise.trainingType);
  const byExerciseType = countBy(selected, (exercise) => exercise.exerciseType);
  const skipReasons = countBy(skipped, (exercise) => exercise.reason);

  return `# Exercise Import Preview

Source: yuhonas/free-exercise-db \`dist/exercises.json\`

No Supabase data was changed. This is a review artifact only.

## Counts

- Source records: ${totalCount}
- Preview selected: ${selected.length}
- Skipped/deferred: ${skipped.length}

## Selected By App Category

${formatCounts(byCategory)}

## Selected By Training Type

${formatCounts(byTrainingType)}

## Selected By Exercise Type

${formatCounts(byExerciseType)}

## Top Skip Reasons

${formatCounts(skipReasons)}

## Next Review Steps

1. Review \`exercises-preview.json\` for category and equipment quality.
2. Review \`skipped-exercises.json\` for useful exercises that were deferred.
3. Adjust mapping rules before generating SQL.
4. Keep images as source paths only until an explicit storage/import phase.
`;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) ?? 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function formatCounts(counts) {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => `- ${key}: ${count}`)
    .join('\n');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function titleCase(value) {
  return value
    .split(' ')
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
