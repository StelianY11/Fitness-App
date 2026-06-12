import { Injectable, inject } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetType,
} from '../../shared/models/fitness.models';

const SESSION_SELECT = [
  'id',
  'user_id',
  'workout_template_id',
  'status',
  'started_at',
  'finished_at',
  'notes',
  'created_at',
  'updated_at',
].join(', ');

const WORKOUT_EXERCISE_SELECT = [
  'id',
  'workout_session_id',
  'exercise_id',
  'exercise_variant_id',
  'workout_template_block_id',
  'workout_template_block_exercise_id',
  'sort_order',
  'notes',
  'created_at',
  'updated_at',
].join(', ');

const SET_SELECT = [
  'id',
  'workout_session_id',
  'workout_exercise_id',
  'exercise_id',
  'exercise_variant_id',
  'set_number',
  'reps',
  'weight_kg',
  'assistance_kg',
  'assistance_type',
  'duration_seconds',
  'distance_meters',
  'rpe',
  'rir',
  'tempo',
  'is_warmup',
  'set_type',
  'completed_at',
  'notes',
  'created_at',
  'updated_at',
].join(', ');

const TEMPLATE_BLOCK_SELECT = [
  'id',
  'sort_order',
].join(', ');

const TEMPLATE_BLOCK_EXERCISE_SELECT = [
  'id',
  'workout_template_block_id',
  'exercise_id',
  'exercise_variant_id',
  'sort_order',
  'notes',
].join(', ');

export interface LiveWorkoutServiceResult<T> {
  data: T;
  error: string | null;
}

export interface AddWorkoutSetInput {
  setNumber?: number;
  reps?: number | null;
  weightKg?: number | null;
  assistanceKg?: number | null;
  assistanceType?: string | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  rpe?: number | null;
  rir?: number | null;
  tempo?: string | null;
  isWarmup?: boolean;
  setType?: WorkoutSetType;
  completedAt?: string | null;
  notes?: string | null;
}

export interface UpdateWorkoutSetInput {
  setNumber?: number;
  reps?: number | null;
  weightKg?: number | null;
  assistanceKg?: number | null;
  assistanceType?: string | null;
  durationSeconds?: number | null;
  distanceMeters?: number | null;
  rpe?: number | null;
  rir?: number | null;
  tempo?: string | null;
  isWarmup?: boolean;
  setType?: WorkoutSetType;
  completedAt?: string | null;
  notes?: string | null;
}

interface WorkoutSessionRow {
  id: string;
  user_id: string;
  workout_template_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutExerciseRow {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  exercise_variant_id: string | null;
  workout_template_block_id: string | null;
  workout_template_block_exercise_id: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutSetRow {
  id: string;
  workout_session_id: string;
  workout_exercise_id: string | null;
  exercise_id: string;
  exercise_variant_id: string | null;
  set_number: number;
  reps: number | null;
  weight_kg: number | string | null;
  assistance_kg: number | string | null;
  assistance_type: string | null;
  duration_seconds: number | null;
  distance_meters: number | string | null;
  rpe: number | string | null;
  rir: number | null;
  tempo: string | null;
  is_warmup: boolean;
  set_type: WorkoutSetType;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TemplateBlockRow {
  id: string;
  sort_order: number;
}

interface TemplateBlockExerciseRow {
  id: string;
  workout_template_block_id: string;
  exercise_id: string | null;
  exercise_variant_id: string | null;
  sort_order: number;
  notes: string | null;
}

interface WorkoutExerciseInsertRow {
  workout_session_id: string;
  exercise_id: string;
  exercise_variant_id: string | null;
  workout_template_block_id: string | null;
  workout_template_block_exercise_id: string | null;
  sort_order: number;
  notes: string | null;
}

interface WorkoutSetInsertRow {
  workout_session_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  exercise_variant_id: string | null;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  assistance_kg: number | null;
  assistance_type: string | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  rpe: number | null;
  rir: number | null;
  tempo: string | null;
  is_warmup: boolean;
  set_type: WorkoutSetType;
  completed_at: string | null;
  notes: string | null;
}

interface WorkoutSetUpdateRow {
  set_number?: number;
  reps?: number | null;
  weight_kg?: number | null;
  assistance_kg?: number | null;
  assistance_type?: string | null;
  duration_seconds?: number | null;
  distance_meters?: number | null;
  rpe?: number | null;
  rir?: number | null;
  tempo?: string | null;
  is_warmup?: boolean;
  set_type?: WorkoutSetType;
  completed_at?: string | null;
  notes?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class LiveWorkoutService {
  private readonly supabase = inject(SupabaseService).client;

  async startWorkoutFromTemplate(
    templateId: string,
  ): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    const userResult = await this.getCurrentUserId();

    if (userResult.error || !userResult.data) {
      return { data: null, error: userResult.error ?? 'No authenticated user.' };
    }

    const sessionResult = await this.createWorkoutSession(userResult.data, templateId);

    if (sessionResult.error || !sessionResult.data) {
      return sessionResult;
    }

    const copyResult = await this.copyTemplateExercisesToWorkout(
      templateId,
      sessionResult.data.id,
    );

    if (copyResult.error) {
      await this.cancelWorkout(sessionResult.data.id);

      return {
        data: sessionResult.data,
        error: copyResult.error,
      };
    }

    return sessionResult;
  }

  async getActiveWorkout(): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    const userResult = await this.getCurrentUserId();

    if (userResult.error || !userResult.data) {
      return { data: null, error: userResult.error ?? 'No authenticated user.' };
    }

    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('user_id', userResult.data)
      .eq('status', 'active')
      .returns<WorkoutSessionRow[]>()
      .order('started_at', { ascending: false })
      .limit(1);

    return {
      data: data?.[0] ? mapWorkoutSession(data[0]) : null,
      error: this.formatError(error),
    };
  }

  async getWorkoutSessionById(
    sessionId: string,
  ): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .select(SESSION_SELECT)
      .eq('id', sessionId)
      .returns<WorkoutSessionRow>()
      .maybeSingle();

    return {
      data: data ? mapWorkoutSession(data) : null,
      error: this.formatError(error),
    };
  }

  async getWorkoutExercises(sessionId: string): Promise<LiveWorkoutServiceResult<WorkoutExercise[]>> {
    const { data, error } = await this.supabase
      .from('workout_exercises')
      .select(WORKOUT_EXERCISE_SELECT)
      .eq('workout_session_id', sessionId)
      .returns<WorkoutExerciseRow[]>()
      .order('sort_order', { ascending: true });

    return {
      data: (data ?? []).map(mapWorkoutExercise),
      error: this.formatError(error),
    };
  }

  async getWorkoutSets(workoutExerciseId: string): Promise<LiveWorkoutServiceResult<WorkoutSet[]>> {
    const { data, error } = await this.supabase
      .from('workout_sets')
      .select(SET_SELECT)
      .eq('workout_exercise_id', workoutExerciseId)
      .returns<WorkoutSetRow[]>()
      .order('set_number', { ascending: true });

    return {
      data: (data ?? []).map(mapWorkoutSet),
      error: this.formatError(error),
    };
  }

  async addSet(
    workoutExerciseId: string,
    input: AddWorkoutSetInput,
  ): Promise<LiveWorkoutServiceResult<WorkoutSet | null>> {
    const workoutExerciseResult = await this.getWorkoutExerciseById(workoutExerciseId);

    if (workoutExerciseResult.error || !workoutExerciseResult.data) {
      return {
        data: null,
        error: workoutExerciseResult.error ?? 'Workout exercise not found.',
      };
    }

    const setNumber =
      input.setNumber ?? await this.getNextSetNumber(workoutExerciseId);
    const payload: WorkoutSetInsertRow = {
      workout_session_id: workoutExerciseResult.data.workoutSessionId,
      workout_exercise_id: workoutExerciseId,
      exercise_id: workoutExerciseResult.data.exerciseId,
      exercise_variant_id: workoutExerciseResult.data.exerciseVariantId,
      set_number: setNumber,
      reps: input.reps ?? null,
      weight_kg: input.weightKg ?? null,
      assistance_kg: input.assistanceKg ?? null,
      assistance_type: input.assistanceType ?? null,
      duration_seconds: input.durationSeconds ?? null,
      distance_meters: input.distanceMeters ?? null,
      rpe: input.rpe ?? null,
      rir: input.rir ?? null,
      tempo: input.tempo ?? null,
      is_warmup: input.isWarmup ?? input.setType === 'warmup',
      set_type: input.setType ?? 'normal',
      completed_at: input.completedAt ?? new Date().toISOString(),
      notes: input.notes ?? null,
    };

    const { data, error } = await this.supabase
      .from('workout_sets')
      .insert(payload)
      .select(SET_SELECT)
      .returns<WorkoutSetRow>()
      .single();

    return {
      data: data ? mapWorkoutSet(data) : null,
      error: this.formatError(error),
    };
  }

  async updateSet(
    setId: string,
    input: UpdateWorkoutSetInput,
  ): Promise<LiveWorkoutServiceResult<WorkoutSet | null>> {
    const payload = mapWorkoutSetUpdateInput(input);

    const { data, error } = await this.supabase
      .from('workout_sets')
      .update(payload)
      .eq('id', setId)
      .select(SET_SELECT)
      .returns<WorkoutSetRow>()
      .maybeSingle();

    return {
      data: data ? mapWorkoutSet(data) : null,
      error: this.formatError(error),
    };
  }

  async deleteSet(setId: string): Promise<LiveWorkoutServiceResult<null>> {
    const { error } = await this.supabase
      .from('workout_sets')
      .delete()
      .eq('id', setId);

    return {
      data: null,
      error: this.formatError(error),
    };
  }

  async finishWorkout(sessionId: string): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    return this.updateWorkoutSessionStatus(sessionId, 'completed');
  }

  async cancelWorkout(sessionId: string): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    return this.updateWorkoutSessionStatus(sessionId, 'cancelled');
  }

  private async createWorkoutSession(
    userId: string,
    templateId: string,
  ): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        workout_template_id: templateId,
        status: 'active',
      })
      .select(SESSION_SELECT)
      .returns<WorkoutSessionRow>()
      .single();

    return {
      data: data ? mapWorkoutSession(data) : null,
      error: this.formatError(error),
    };
  }

  private async copyTemplateExercisesToWorkout(
    templateId: string,
    sessionId: string,
  ): Promise<LiveWorkoutServiceResult<WorkoutExercise[]>> {
    const { data: blockRows, error: blocksError } = await this.supabase
      .from('workout_template_blocks')
      .select(TEMPLATE_BLOCK_SELECT)
      .eq('workout_template_id', templateId)
      .returns<TemplateBlockRow[]>()
      .order('sort_order', { ascending: true });

    if (blocksError) {
      return { data: [], error: this.formatError(blocksError) };
    }

    const inserts: WorkoutExerciseInsertRow[] = [];
    let sortOrder = 1;

    for (const block of blockRows ?? []) {
      const { data: exerciseRows, error: exercisesError } = await this.supabase
        .from('workout_template_block_exercises')
        .select(TEMPLATE_BLOCK_EXERCISE_SELECT)
        .eq('workout_template_block_id', block.id)
        .not('exercise_id', 'is', null)
        .returns<TemplateBlockExerciseRow[]>()
        .order('sort_order', { ascending: true });

      if (exercisesError) {
        return { data: [], error: this.formatError(exercisesError) };
      }

      for (const exercise of exerciseRows ?? []) {
        if (!exercise.exercise_id) {
          continue;
        }

        inserts.push({
          workout_session_id: sessionId,
          exercise_id: exercise.exercise_id,
          exercise_variant_id: exercise.exercise_variant_id,
          workout_template_block_id: block.id,
          workout_template_block_exercise_id: exercise.id,
          sort_order: sortOrder,
          notes: exercise.notes,
        });
        sortOrder += 1;
      }
    }

    if (inserts.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await this.supabase
      .from('workout_exercises')
      .insert(inserts)
      .select(WORKOUT_EXERCISE_SELECT)
      .returns<WorkoutExerciseRow[]>()
      .order('sort_order', { ascending: true });

    return {
      data: (data ?? []).map(mapWorkoutExercise),
      error: this.formatError(error),
    };
  }

  private async getWorkoutExerciseById(
    workoutExerciseId: string,
  ): Promise<LiveWorkoutServiceResult<WorkoutExercise | null>> {
    const { data, error } = await this.supabase
      .from('workout_exercises')
      .select(WORKOUT_EXERCISE_SELECT)
      .eq('id', workoutExerciseId)
      .returns<WorkoutExerciseRow>()
      .maybeSingle();

    return {
      data: data ? mapWorkoutExercise(data) : null,
      error: this.formatError(error),
    };
  }

  private async getNextSetNumber(workoutExerciseId: string): Promise<number> {
    const { data } = await this.supabase
      .from('workout_sets')
      .select('set_number')
      .eq('workout_exercise_id', workoutExerciseId)
      .returns<{ set_number: number }[]>()
      .order('set_number', { ascending: false })
      .limit(1);

    return (data?.[0]?.set_number ?? 0) + 1;
  }

  private async updateWorkoutSessionStatus(
    sessionId: string,
    status: 'completed' | 'cancelled',
  ): Promise<LiveWorkoutServiceResult<WorkoutSession | null>> {
    const { data, error } = await this.supabase
      .from('workout_sessions')
      .update({
        status,
        finished_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select(SESSION_SELECT)
      .returns<WorkoutSessionRow>()
      .maybeSingle();

    return {
      data: data ? mapWorkoutSession(data) : null,
      error: this.formatError(error),
    };
  }

  private async getCurrentUserId(): Promise<LiveWorkoutServiceResult<string | null>> {
    const { data, error } = await this.supabase.auth.getUser();

    return {
      data: data.user?.id ?? null,
      error: error?.message ?? null,
    };
  }

  private formatError(error: PostgrestError | null): string | null {
    if (!error) {
      return null;
    }

    return [error.message, error.details, error.hint].filter(Boolean).join(' ');
  }
}

function mapWorkoutSession(row: WorkoutSessionRow): WorkoutSession {
  return {
    id: row.id,
    userId: row.user_id,
    workoutTemplateId: row.workout_template_id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutExercise(row: WorkoutExerciseRow): WorkoutExercise {
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    exerciseId: row.exercise_id,
    exerciseVariantId: row.exercise_variant_id,
    workoutTemplateBlockId: row.workout_template_block_id,
    workoutTemplateBlockExerciseId: row.workout_template_block_exercise_id,
    sortOrder: row.sort_order,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    workoutExerciseId: row.workout_exercise_id,
    exerciseId: row.exercise_id,
    exerciseVariantId: row.exercise_variant_id,
    setNumber: row.set_number,
    reps: row.reps,
    weightKg: toNullableNumber(row.weight_kg),
    assistanceKg: toNullableNumber(row.assistance_kg),
    assistanceType: row.assistance_type,
    durationSeconds: row.duration_seconds,
    distanceMeters: toNullableNumber(row.distance_meters),
    rpe: toNullableNumber(row.rpe),
    rir: row.rir,
    tempo: row.tempo,
    isWarmup: row.is_warmup,
    setType: row.set_type,
    completedAt: row.completed_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutSetUpdateInput(input: UpdateWorkoutSetInput): WorkoutSetUpdateRow {
  const payload: WorkoutSetUpdateRow = {};

  if (input.setNumber !== undefined) {
    payload.set_number = input.setNumber;
  }

  if (input.reps !== undefined) {
    payload.reps = input.reps;
  }

  if (input.weightKg !== undefined) {
    payload.weight_kg = input.weightKg;
  }

  if (input.assistanceKg !== undefined) {
    payload.assistance_kg = input.assistanceKg;
  }

  if (input.assistanceType !== undefined) {
    payload.assistance_type = input.assistanceType;
  }

  if (input.durationSeconds !== undefined) {
    payload.duration_seconds = input.durationSeconds;
  }

  if (input.distanceMeters !== undefined) {
    payload.distance_meters = input.distanceMeters;
  }

  if (input.rpe !== undefined) {
    payload.rpe = input.rpe;
  }

  if (input.rir !== undefined) {
    payload.rir = input.rir;
  }

  if (input.tempo !== undefined) {
    payload.tempo = input.tempo;
  }

  if (input.isWarmup !== undefined) {
    payload.is_warmup = input.isWarmup;
  }

  if (input.setType !== undefined) {
    payload.set_type = input.setType;
  }

  if (input.completedAt !== undefined) {
    payload.completed_at = input.completedAt;
  }

  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }

  return payload;
}

function toNullableNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  return typeof value === 'number' ? value : Number(value);
}
