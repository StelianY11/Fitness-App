import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_DIR = path.resolve('tools/exercise-import/output');
const PREVIEW_PATH = path.join(OUTPUT_DIR, 'exercises-preview.json');
const CANONICAL_PATH = path.join(OUTPUT_DIR, 'canonical-exercises.json');
const ALIASES_PATH = path.join(OUTPUT_DIR, 'exercise-aliases.json');
const REPORT_PATH = path.join(OUTPUT_DIR, 'normalization-report.md');

const explicitAliasGroups = [
  {
    canonicalName: 'Pull Up',
    aliases: ['Pull-Up', 'Pullup', 'Pullups', 'Pullups', 'Pull-Ups'],
  },
  {
    canonicalName: 'Push Up',
    aliases: ['Push-Up', 'Pushup', 'Pushups', 'Push-Ups'],
  },
  {
    canonicalName: 'Bench Press',
    aliases: [
      'Barbell Bench Press',
      'Barbell Bench Press - Medium Grip',
      'Flat Bench Press',
      'Flat Barbell Bench Press',
    ],
  },
  {
    canonicalName: 'Dumbbell Bench Press',
    aliases: ['Flat Dumbbell Bench Press'],
  },
  {
    canonicalName: 'Squat',
    aliases: ['Barbell Full Squat', 'Barbell Squat', 'Full Squat'],
  },
  {
    canonicalName: 'Biceps Curl',
    aliases: ['Barbell Curl', 'Dumbbell Curl', 'Bicep Curl'],
  },
  {
    canonicalName: 'Triceps Pushdown',
    aliases: ['Tricep Pushdown', 'Cable Triceps Pushdown'],
  },
  {
    canonicalName: 'Lateral Raise',
    aliases: ['Side Lateral Raise', 'Dumbbell Lateral Raise'],
  },
  {
    canonicalName: 'Seated Cable Row',
    aliases: ['Cable Seated Row', 'Seated Cable Rows'],
  },
  {
    canonicalName: 'Lat Pulldown',
    aliases: ['Wide-Grip Lat Pulldown', 'Wide Grip Lat Pulldown'],
  },
  {
    canonicalName: 'Sit Up',
    aliases: ['Sit-Up', '3/4 Sit-Up'],
  },
  {
    canonicalName: 'Crunch',
    aliases: ['Crunches'],
  },
  {
    canonicalName: 'Plank',
    aliases: ['Standard Plank'],
  },
];

const raw = await readFile(PREVIEW_PATH, 'utf8');
const previewExercises = JSON.parse(raw);

if (!Array.isArray(previewExercises)) {
  throw new Error(`Expected ${PREVIEW_PATH} to contain a JSON array.`);
}

const explicitAliasLookup = buildExplicitAliasLookup(explicitAliasGroups);
const groups = new Map();
const manualReview = [];

for (const exercise of previewExercises) {
  const explicitCanonical = explicitAliasLookup.get(normalizeLookupKey(exercise.name));
  const canonicalName = explicitCanonical ?? deriveCanonicalName(exercise.name);
  const canonicalKey = normalizeLookupKey(canonicalName);

  if (!groups.has(canonicalKey)) {
    groups.set(canonicalKey, {
      canonicalName,
      records: [],
      aliases: new Set(),
      reasons: new Set(),
    });
  }

  const group = groups.get(canonicalKey);
  group.records.push(exercise);

  if (exercise.name !== canonicalName) {
    group.aliases.add(exercise.name);
    group.reasons.add(explicitCanonical ? 'explicit alias rule' : 'normalized punctuation/pluralization');
  }
}

const groupList = [...groups.values()];

for (let index = 0; index < groupList.length; index += 1) {
  for (let otherIndex = index + 1; otherIndex < groupList.length; otherIndex += 1) {
    const left = groupList[index];
    const right = groupList[otherIndex];
    const reviewReason = getManualReviewReason(left, right);

    if (reviewReason) {
      manualReview.push({
        leftCanonicalName: left.canonicalName,
        rightCanonicalName: right.canonicalName,
        leftExamples: left.records.map((record) => record.name),
        rightExamples: right.records.map((record) => record.name),
        reason: reviewReason,
      });
    }
  }
}

const canonicalExercises = groupList
  .map(toCanonicalExercise)
  .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName));

const exerciseAliases = groupList
  .flatMap(toAliasRows)
  .sort((left, right) => left.canonicalName.localeCompare(right.canonicalName) || left.alias.localeCompare(right.alias));

await writeJson(CANONICAL_PATH, canonicalExercises);
await writeJson(ALIASES_PATH, exerciseAliases);
await writeFile(REPORT_PATH, buildReport(previewExercises, canonicalExercises, exerciseAliases, manualReview), 'utf8');

console.log(`Canonical exercises written to ${CANONICAL_PATH}`);
console.log(`Exercise aliases written to ${ALIASES_PATH}`);
console.log(`Normalization report written to ${REPORT_PATH}`);

function buildExplicitAliasLookup(aliasGroups) {
  const lookup = new Map();

  for (const group of aliasGroups) {
    lookup.set(normalizeLookupKey(group.canonicalName), group.canonicalName);

    for (const alias of group.aliases) {
      lookup.set(normalizeLookupKey(alias), group.canonicalName);
    }
  }

  return lookup;
}

function deriveCanonicalName(name) {
  const cleaned = name
    .replace(/\s*-\s*medium grip$/i, '')
    .replace(/\s*-\s*(chest|triceps) version$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(' ')
    .map((part) => {
      if (/^(3\/4|e-z)$/i.test(part)) return part.toUpperCase();
      return `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`;
    })
    .join(' ');
}

function normalizeLookupKey(name) {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[-_/(),]/g, ' ')
    .replace(/\bups\b/g, 'up')
    .replace(/\bpushups\b/g, 'push up')
    .replace(/\bpullups\b/g, 'pull up')
    .replace(/\bcrunches\b/g, 'crunch')
    .replace(/\bcurls\b/g, 'curl')
    .replace(/\brows\b/g, 'row')
    .replace(/\braises\b/g, 'raise')
    .replace(/\bextensions\b/g, 'extension')
    .replace(/\s+/g, ' ')
    .trim();
}

function getManualReviewReason(left, right) {
  const leftTokens = tokenSet(left.canonicalName);
  const rightTokens = tokenSet(right.canonicalName);
  const overlap = jaccard(leftTokens, rightTokens);

  if (left.canonicalName === right.canonicalName) {
    return null;
  }

  if (overlap >= 0.75) {
    return `high token overlap (${overlap.toFixed(2)})`;
  }

  if (sharesProgressionGroup(left, right) && overlap >= 0.45) {
    return `same progression group with partial overlap (${overlap.toFixed(2)})`;
  }

  if (isBenchPressFamily(left.canonicalName, right.canonicalName) && overlap >= 0.4) {
    return `bench press family needs review (${overlap.toFixed(2)})`;
  }

  return null;
}

function tokenSet(name) {
  const ignored = new Set(['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'standing', 'seated']);
  return new Set(
    normalizeLookupKey(name)
      .split(' ')
      .filter((token) => token && !ignored.has(token)),
  );
}

function jaccard(left, right) {
  const intersection = [...left].filter((value) => right.has(value)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function sharesProgressionGroup(left, right) {
  const leftGroups = new Set(left.records.map((record) => record.progressionGroup).filter(Boolean));
  return right.records.some((record) => record.progressionGroup && leftGroups.has(record.progressionGroup));
}

function isBenchPressFamily(leftName, rightName) {
  return /bench press/i.test(leftName) && /bench press/i.test(rightName);
}

function toCanonicalExercise(group) {
  const primary = choosePrimaryRecord(group);
  const aliases = [...group.aliases].sort((left, right) => left.localeCompare(right));

  return {
    canonicalName: group.canonicalName,
    sourceIds: group.records.map((record) => record.sourceId),
    aliases,
    categoryName: primary.categoryName,
    primaryMuscle: primary.primaryMuscle,
    muscleGroups: unique(group.records.flatMap((record) => record.muscleGroups)),
    equipmentOptions: unique(group.records.map((record) => record.equipment)),
    trainingTypes: unique(group.records.map((record) => record.trainingType)),
    exerciseTypes: unique(group.records.map((record) => record.exerciseType)),
    defaultUnit: primary.defaultUnit,
    difficulty: primary.difficulty,
    confidence: aliases.length > 0 ? 'high' : 'single-record',
    reasons: [...group.reasons].sort(),
  };
}

function toAliasRows(group) {
  return [...group.aliases].map((alias) => ({
    canonicalName: group.canonicalName,
    alias,
    confidence: 'high',
    reason: [...group.reasons].join('; ') || 'normalized alias',
  }));
}

function choosePrimaryRecord(group) {
  const exactCanonical = group.records.find((record) => record.name === group.canonicalName);
  return exactCanonical ?? group.records[0];
}

function buildReport(sourceExercises, canonicalExercises, exerciseAliases, manualReview) {
  return `# Exercise Normalization Report

No Supabase data was changed. No SQL was generated.

## Counts

- Preview records read: ${sourceExercises.length}
- Canonical exercises: ${canonicalExercises.length}
- Aliases: ${exerciseAliases.length}
- Needs manual review: ${manualReview.length}

## Alias Groups

${formatAliasGroups(canonicalExercises)}

## Needs Manual Review

${formatManualReview(manualReview)}

## Notes

- High-confidence aliases use explicit rules or punctuation/plural normalization.
- Low-confidence near matches are listed for manual review instead of being merged.
- Canonical naming keeps future Gym, Calisthenics, and Street Workout support in mind by preserving equipment options, exercise types, training types, and progression groups.
`;
}

function formatAliasGroups(canonicalExercises) {
  const withAliases = canonicalExercises.filter((exercise) => exercise.aliases.length > 0);

  if (withAliases.length === 0) {
    return 'No alias groups detected.';
  }

  return withAliases
    .map((exercise) => {
      const aliases = exercise.aliases.map((alias) => `  - ${alias}`).join('\n');
      return `- ${exercise.canonicalName}\n${aliases}`;
    })
    .join('\n\n');
}

function formatManualReview(manualReview) {
  if (manualReview.length === 0) {
    return 'No uncertain near-duplicates detected.';
  }

  return manualReview
    .map(
      (item) => `- ${item.leftCanonicalName} <> ${item.rightCanonicalName}
  - Reason: ${item.reason}
  - Left examples: ${item.leftExamples.join(', ')}
  - Right examples: ${item.rightExamples.join(', ')}`,
    )
    .join('\n\n');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
