import { Injectable, inject } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  Exercise,
  ExerciseCategory,
} from '../../shared/models/fitness.models';

const EXERCISE_SELECT = [
  'id',
  'category_id',
  'owner_id',
  'name',
  'description',
  'instructions',
  'muscle_groups',
  'equipment',
  'training_type',
  'exercise_type',
  'progression_group',
  'progression_level',
  'default_unit',
  'supports_weight',
  'supports_assistance',
  'supports_duration',
  'supports_distance',
  'is_builtin',
  'created_at',
  'updated_at',
].join(', ');

export interface ExerciseServiceResult<T> {
  data: T;
  error: string | null;
}

interface ExerciseCategoryRow {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

interface ExerciseRow {
  id: string;
  category_id: string | null;
  owner_id: string | null;
  name: string;
  description: string | null;
  instructions: string | null;
  muscle_groups: string[];
  equipment: string | null;
  training_type: string | null;
  exercise_type: string | null;
  progression_group: string | null;
  progression_level: number | null;
  default_unit: string | null;
  supports_weight: boolean;
  supports_assistance: boolean;
  supports_duration: boolean;
  supports_distance: boolean;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly supabase = inject(SupabaseService).client;

  async getCategories(): Promise<ExerciseServiceResult<ExerciseCategory[]>> {
    const { data, error } = await this.supabase
      .from('exercise_categories')
      .select(
        'id, owner_id, name, description, is_builtin, created_at, updated_at',
      )
      .returns<ExerciseCategoryRow[]>()
      .order('name', { ascending: true });

    return {
      data: (data ?? []).map(mapExerciseCategory),
      error: this.formatError(error),
    };
  }

  async getExercises(): Promise<ExerciseServiceResult<Exercise[]>> {
    const { data, error } = await this.supabase
      .from('exercises')
      .select(EXERCISE_SELECT)
      .returns<ExerciseRow[]>()
      .order('name', { ascending: true });

    return {
      data: (data ?? []).map(mapExercise),
      error: this.formatError(error),
    };
  }

  async getExercisesByCategory(
    categoryId: string,
  ): Promise<ExerciseServiceResult<Exercise[]>> {
    const { data, error } = await this.supabase
      .from('exercises')
      .select(EXERCISE_SELECT)
      .eq('category_id', categoryId)
      .returns<ExerciseRow[]>()
      .order('name', { ascending: true });

    return {
      data: (data ?? []).map(mapExercise),
      error: this.formatError(error),
    };
  }

  async searchExercises(query: string): Promise<ExerciseServiceResult<Exercise[]>> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return this.getExercises();
    }

    const { data, error } = await this.supabase
      .from('exercises')
      .select(EXERCISE_SELECT)
      .ilike('name', `%${trimmedQuery}%`)
      .returns<ExerciseRow[]>()
      .order('name', { ascending: true });

    return {
      data: (data ?? []).map(mapExercise),
      error: this.formatError(error),
    };
  }

  private formatError(error: PostgrestError | null): string | null {
    return error?.message ?? null;
  }
}

function mapExerciseCategory(row: ExerciseCategoryRow): ExerciseCategory {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    categoryId: row.category_id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    instructions: row.instructions,
    muscleGroups: row.muscle_groups,
    equipment: row.equipment,
    trainingType: row.training_type,
    exerciseType: row.exercise_type,
    progressionGroup: row.progression_group,
    progressionLevel: row.progression_level,
    defaultUnit: row.default_unit,
    supportsWeight: row.supports_weight,
    supportsAssistance: row.supports_assistance,
    supportsDuration: row.supports_duration,
    supportsDistance: row.supports_distance,
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
