import { Injectable, inject } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  WorkoutTemplate,
  WorkoutTemplateBlock,
  WorkoutTemplateBlockExercise,
  WorkoutTemplateBlockType,
  WorkoutTemplateSetType,
} from '../../shared/models/fitness.models';

const TEMPLATE_SELECT = [
  'id',
  'owner_id',
  'name',
  'description',
  'goal',
  'difficulty',
  'estimated_duration_minutes',
  'is_builtin',
  'created_at',
  'updated_at',
].join(', ');

const BLOCK_SELECT = [
  'id',
  'workout_template_id',
  'title',
  'block_type',
  'sort_order',
  'notes',
  'created_at',
  'updated_at',
].join(', ');

const BLOCK_EXERCISE_SELECT = [
  'id',
  'workout_template_block_id',
  'exercise_id',
  'exercise_variant_id',
  'sort_order',
  'set_type',
  'target_sets',
  'target_reps',
  'target_weight_kg',
  'target_duration_seconds',
  'target_distance_meters',
  'rest_seconds',
  'tempo',
  'rir',
  'notes',
  'created_at',
  'updated_at',
].join(', ');

export interface WorkoutTemplateServiceResult<T> {
  data: T;
  error: string | null;
}

export interface CreateWorkoutTemplateInput {
  name: string;
  description?: string | null;
  goal?: string | null;
  difficulty?: string | null;
  estimatedDurationMinutes?: number | null;
}

export interface UpdateWorkoutTemplateInput {
  name?: string;
  description?: string | null;
  goal?: string | null;
  difficulty?: string | null;
  estimatedDurationMinutes?: number | null;
}

interface WorkoutTemplateRow {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  estimated_duration_minutes: number | null;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkoutTemplateBlockRow {
  id: string;
  workout_template_id: string;
  title: string | null;
  block_type: WorkoutTemplateBlockType;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutTemplateBlockExerciseRow {
  id: string;
  workout_template_block_id: string;
  exercise_id: string | null;
  exercise_variant_id: string | null;
  sort_order: number;
  set_type: WorkoutTemplateSetType;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_duration_seconds: number | null;
  target_distance_meters: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  rir: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutTemplateInsertRow {
  owner_id: string;
  name: string;
  description: string | null;
  goal: string | null;
  difficulty: string | null;
  estimated_duration_minutes: number | null;
  is_builtin: false;
}

interface WorkoutTemplateUpdateRow {
  name?: string;
  description?: string | null;
  goal?: string | null;
  difficulty?: string | null;
  estimated_duration_minutes?: number | null;
}

interface WorkoutTemplateBlockInsertRow {
  workout_template_id: string;
  title: string | null;
  block_type: WorkoutTemplateBlockType;
  sort_order: number;
  notes: string | null;
}

interface WorkoutTemplateBlockExerciseInsertRow {
  workout_template_block_id: string;
  exercise_id: string | null;
  exercise_variant_id: string | null;
  sort_order: number;
  set_type: WorkoutTemplateSetType;
  target_sets: number | null;
  target_reps: string | null;
  target_weight_kg: number | null;
  target_duration_seconds: number | null;
  target_distance_meters: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  rir: number | null;
  notes: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class WorkoutTemplateService {
  private readonly supabase = inject(SupabaseService).client;

  async getMyTemplates(): Promise<WorkoutTemplateServiceResult<WorkoutTemplate[]>> {
    const userResult = await this.getCurrentUserId();

    if (userResult.error || !userResult.data) {
      return { data: [], error: userResult.error ?? 'No authenticated user.' };
    }

    const { data, error } = await this.supabase
      .from('workout_templates')
      .select(TEMPLATE_SELECT)
      .eq('owner_id', userResult.data)
      .eq('is_builtin', false)
      .returns<WorkoutTemplateRow[]>()
      .order('created_at', { ascending: false });

    return {
      data: (data ?? []).map(mapWorkoutTemplate),
      error: this.formatError(error),
    };
  }

  async getBuiltinTemplates(): Promise<WorkoutTemplateServiceResult<WorkoutTemplate[]>> {
    const { data, error } = await this.supabase
      .from('workout_templates')
      .select(TEMPLATE_SELECT)
      .eq('is_builtin', true)
      .returns<WorkoutTemplateRow[]>()
      .order('name', { ascending: true });

    return {
      data: (data ?? []).map(mapWorkoutTemplate),
      error: this.formatError(error),
    };
  }

  async getTemplateById(
    id: string,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplate | null>> {
    const { data, error } = await this.supabase
      .from('workout_templates')
      .select(TEMPLATE_SELECT)
      .eq('id', id)
      .returns<WorkoutTemplateRow>()
      .maybeSingle();

    return {
      data: data ? mapWorkoutTemplate(data) : null,
      error: this.formatError(error),
    };
  }

  async createTemplate(
    input: CreateWorkoutTemplateInput,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplate | null>> {
    const userResult = await this.getCurrentUserId();

    if (userResult.error || !userResult.data) {
      return { data: null, error: userResult.error ?? 'No authenticated user.' };
    }

    const payload: WorkoutTemplateInsertRow = {
      owner_id: userResult.data,
      name: input.name.trim(),
      description: input.description ?? null,
      goal: input.goal ?? null,
      difficulty: input.difficulty ?? null,
      estimated_duration_minutes: input.estimatedDurationMinutes ?? null,
      is_builtin: false,
    };

    const { data, error } = await this.supabase
      .from('workout_templates')
      .insert(payload)
      .select(TEMPLATE_SELECT)
      .returns<WorkoutTemplateRow>()
      .single();

    return {
      data: data ? mapWorkoutTemplate(data) : null,
      error: this.formatError(error),
    };
  }

  async updateTemplate(
    id: string,
    input: UpdateWorkoutTemplateInput,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplate | null>> {
    const payload: WorkoutTemplateUpdateRow = {};

    if (input.name !== undefined) {
      payload.name = input.name.trim();
    }

    if (input.description !== undefined) {
      payload.description = input.description;
    }

    if (input.goal !== undefined) {
      payload.goal = input.goal;
    }

    if (input.difficulty !== undefined) {
      payload.difficulty = input.difficulty;
    }

    if (input.estimatedDurationMinutes !== undefined) {
      payload.estimated_duration_minutes = input.estimatedDurationMinutes;
    }

    const { data, error } = await this.supabase
      .from('workout_templates')
      .update(payload)
      .eq('id', id)
      .eq('is_builtin', false)
      .select(TEMPLATE_SELECT)
      .returns<WorkoutTemplateRow>()
      .maybeSingle();

    return {
      data: data ? mapWorkoutTemplate(data) : null,
      error: this.formatError(error),
    };
  }

  async deleteTemplate(id: string): Promise<WorkoutTemplateServiceResult<null>> {
    const { error } = await this.supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
      .eq('is_builtin', false);

    return {
      data: null,
      error: this.formatError(error),
    };
  }

  async duplicateTemplate(
    id: string,
    name?: string,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplate | null>> {
    const sourceResult = await this.getTemplateById(id);

    if (sourceResult.error || !sourceResult.data) {
      return {
        data: null,
        error: sourceResult.error ?? 'Template not found.',
      };
    }

    const createdResult = await this.createTemplate({
      name: name?.trim() || `${sourceResult.data.name} Copy`,
      description: sourceResult.data.description,
      goal: sourceResult.data.goal,
      difficulty: sourceResult.data.difficulty,
      estimatedDurationMinutes: sourceResult.data.estimatedDurationMinutes,
    });

    if (createdResult.error || !createdResult.data) {
      return createdResult;
    }

    const blocksResult = await this.getTemplateBlocks(id);

    if (blocksResult.error) {
      return { data: createdResult.data, error: blocksResult.error };
    }

    for (const block of blocksResult.data) {
      const blockResult = await this.duplicateBlock(block, createdResult.data.id);

      if (blockResult.error || !blockResult.data) {
        return {
          data: createdResult.data,
          error: blockResult.error ?? 'Unable to duplicate template block.',
        };
      }

      const exercisesResult = await this.getTemplateExercises(block.id);

      if (exercisesResult.error) {
        return { data: createdResult.data, error: exercisesResult.error };
      }

      if (exercisesResult.data.length > 0) {
        const exerciseInsertResult = await this.duplicateBlockExercises(
          exercisesResult.data,
          blockResult.data.id,
        );

        if (exerciseInsertResult.error) {
          return { data: createdResult.data, error: exerciseInsertResult.error };
        }
      }
    }

    return createdResult;
  }

  async getTemplateBlocks(
    templateId: string,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplateBlock[]>> {
    const { data, error } = await this.supabase
      .from('workout_template_blocks')
      .select(BLOCK_SELECT)
      .eq('workout_template_id', templateId)
      .returns<WorkoutTemplateBlockRow[]>()
      .order('sort_order', { ascending: true });

    return {
      data: (data ?? []).map(mapWorkoutTemplateBlock),
      error: this.formatError(error),
    };
  }

  async getTemplateExercises(
    blockId: string,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplateBlockExercise[]>> {
    const { data, error } = await this.supabase
      .from('workout_template_block_exercises')
      .select(BLOCK_EXERCISE_SELECT)
      .eq('workout_template_block_id', blockId)
      .returns<WorkoutTemplateBlockExerciseRow[]>()
      .order('sort_order', { ascending: true });

    return {
      data: (data ?? []).map(mapWorkoutTemplateBlockExercise),
      error: this.formatError(error),
    };
  }

  private async duplicateBlock(
    block: WorkoutTemplateBlock,
    templateId: string,
  ): Promise<WorkoutTemplateServiceResult<WorkoutTemplateBlock | null>> {
    const payload: WorkoutTemplateBlockInsertRow = {
      workout_template_id: templateId,
      title: block.title,
      block_type: block.blockType,
      sort_order: block.sortOrder,
      notes: block.notes,
    };

    const { data, error } = await this.supabase
      .from('workout_template_blocks')
      .insert(payload)
      .select(BLOCK_SELECT)
      .returns<WorkoutTemplateBlockRow>()
      .single();

    return {
      data: data ? mapWorkoutTemplateBlock(data) : null,
      error: this.formatError(error),
    };
  }

  private async duplicateBlockExercises(
    exercises: WorkoutTemplateBlockExercise[],
    blockId: string,
  ): Promise<WorkoutTemplateServiceResult<null>> {
    const payload: WorkoutTemplateBlockExerciseInsertRow[] = exercises.map((exercise) => ({
      workout_template_block_id: blockId,
      exercise_id: exercise.exerciseId,
      exercise_variant_id: exercise.exerciseVariantId,
      sort_order: exercise.sortOrder,
      set_type: exercise.setType,
      target_sets: exercise.targetSets,
      target_reps: exercise.targetReps,
      target_weight_kg: exercise.targetWeightKg,
      target_duration_seconds: exercise.targetDurationSeconds,
      target_distance_meters: exercise.targetDistanceMeters,
      rest_seconds: exercise.restSeconds,
      tempo: exercise.tempo,
      rir: exercise.rir,
      notes: exercise.notes,
    }));

    const { error } = await this.supabase
      .from('workout_template_block_exercises')
      .insert(payload);

    return {
      data: null,
      error: this.formatError(error),
    };
  }

  private async getCurrentUserId(): Promise<WorkoutTemplateServiceResult<string | null>> {
    const { data, error } = await this.supabase.auth.getUser();

    return {
      data: data.user?.id ?? null,
      error: error?.message ?? null,
    };
  }

  private formatError(error: PostgrestError | null): string | null {
    return error?.message ?? null;
  }
}

function mapWorkoutTemplate(row: WorkoutTemplateRow): WorkoutTemplate {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    goal: row.goal,
    difficulty: row.difficulty,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutTemplateBlock(row: WorkoutTemplateBlockRow): WorkoutTemplateBlock {
  return {
    id: row.id,
    workoutTemplateId: row.workout_template_id,
    title: row.title,
    blockType: row.block_type,
    sortOrder: row.sort_order,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutTemplateBlockExercise(
  row: WorkoutTemplateBlockExerciseRow,
): WorkoutTemplateBlockExercise {
  return {
    id: row.id,
    workoutTemplateBlockId: row.workout_template_block_id,
    exerciseId: row.exercise_id,
    exerciseVariantId: row.exercise_variant_id,
    sortOrder: row.sort_order,
    setType: row.set_type,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetWeightKg: row.target_weight_kg,
    targetDurationSeconds: row.target_duration_seconds,
    targetDistanceMeters: row.target_distance_meters,
    restSeconds: row.rest_seconds,
    tempo: row.tempo,
    rir: row.rir,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
