export type PreFillMode = 'LAST_WORKOUT' | 'TEMPLATE' | 'EMPTY';

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  preFillMode: PreFillMode;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseCategory {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  categoryId: string | null;
  ownerId: string | null;
  name: string;
  description: string | null;
  instructions: string | null;
  muscleGroups: string[];
  equipment: string | null;
  trainingType: string | null;
  exerciseType: string | null;
  progressionGroup: string | null;
  progressionLevel: number | null;
  defaultUnit: string | null;
  supportsWeight: boolean;
  supportsAssistance: boolean;
  supportsDuration: boolean;
  supportsDistance: boolean;
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseVariant {
  id: string;
  exerciseId: string;
  name: string;
  description: string | null;
  variantType: string | null;
  gripType: string | null;
  equipment: string | null;
  assistanceType: string | null;
  loadType: string | null;
  progressionLevel: number | null;
  sortOrder: number;
  isBuiltin: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplate {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  estimatedDurationMinutes: number | null;
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkoutTemplateBlockType =
  | 'normal'
  | 'warmup'
  | 'superset'
  | 'dropset'
  | 'giant_set'
  | 'circuit'
  | 'notes';

export interface WorkoutTemplateBlock {
  id: string;
  workoutTemplateId: string;
  title: string | null;
  blockType: WorkoutTemplateBlockType;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkoutTemplateSetType =
  | 'warmup'
  | 'working'
  | 'dropset'
  | 'backoff'
  | 'failure'
  | 'note';

export interface WorkoutTemplateBlockExercise {
  id: string;
  workoutTemplateBlockId: string;
  exerciseId: string | null;
  exerciseVariantId: string | null;
  sortOrder: number;
  setType: WorkoutTemplateSetType;
  targetSets: number | null;
  targetReps: string | null;
  targetWeightKg: number | null;
  targetDurationSeconds: number | null;
  targetDistanceMeters: number | null;
  restSeconds: number | null;
  tempo: string | null;
  rir: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  workoutTemplateId: string;
  exerciseId: string;
  position: number;
  targetSets: number | null;
  targetReps: string | null;
  restSeconds: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutTemplateId: string | null;
  status: 'active' | 'completed' | 'cancelled';
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutExercise {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  exerciseVariantId: string | null;
  workoutTemplateBlockId: string | null;
  workoutTemplateBlockExerciseId: string | null;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkoutSetType =
  | 'normal'
  | 'warmup'
  | 'dropset'
  | 'failure'
  | 'assisted'
  | 'forced'
  | 'partial'
  | 'hold'
  | 'timed'
  | 'distance';

export interface WorkoutSet {
  id: string;
  workoutSessionId: string;
  workoutExerciseId: string | null;
  exerciseId: string;
  exerciseVariantId: string | null;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  assistanceKg: number | null;
  assistanceType: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  rpe: number | null;
  rir: number | null;
  tempo: string | null;
  isWarmup: boolean;
  setType: WorkoutSetType;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseHistorySet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  assistanceKg: number | null;
  assistanceType: string | null;
  durationSeconds: number | null;
  notes: string | null;
}

export interface ExerciseHistoryWorkout {
  workoutSessionId: string;
  workoutDate: string;
  workoutTemplateId: string | null;
  workoutName: string;
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseHistorySet[];
}

export interface BodyWeightHistory {
  id: string;
  userId: string;
  measuredAt: string;
  weightKg: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
