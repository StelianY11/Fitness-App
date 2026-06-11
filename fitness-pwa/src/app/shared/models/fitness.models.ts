export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
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

export interface WorkoutTemplate {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  isBuiltin: boolean;
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
  startedAt: string;
  finishedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
