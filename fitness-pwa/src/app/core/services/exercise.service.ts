import { Injectable, inject } from '@angular/core';
import { PostgrestError } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';
import {
  Exercise,
  ExerciseCategory,
} from '../../shared/models/fitness.models';

const BASE_EXERCISE_SELECT = [
  'id',
  'category_id',
  'owner_id',
  'name',
  'description',
  'instructions',
  'muscle_groups',
  'equipment',
  'is_builtin',
  'created_at',
  'updated_at',
].join(', ');

const EXTENDED_EXERCISE_SELECT = [
  BASE_EXERCISE_SELECT,
  'training_type',
  'exercise_type',
  'progression_group',
  'progression_level',
  'default_unit',
  'supports_weight',
  'supports_assistance',
  'supports_duration',
  'supports_distance',
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
  training_type?: string | null;
  exercise_type?: string | null;
  progression_group?: string | null;
  progression_level?: number | null;
  default_unit?: string | null;
  supports_weight?: boolean | null;
  supports_assistance?: boolean | null;
  supports_duration?: boolean | null;
  supports_distance?: boolean | null;
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
    return this.fetchExercises();
  }

  async getExercisesByCategory(
    categoryId: string,
  ): Promise<ExerciseServiceResult<Exercise[]>> {
    return this.fetchExercises({ categoryId });
  }

  async searchExercises(query: string): Promise<ExerciseServiceResult<Exercise[]>> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return this.getExercises();
    }

    return this.fetchExercises({ searchQuery: trimmedQuery });
  }

  private formatError(error: PostgrestError | null): string | null {
    return error?.message ?? null;
  }

  private async fetchExercises(filters: {
    categoryId?: string;
    searchQuery?: string;
  } = {}): Promise<ExerciseServiceResult<Exercise[]>> {
    const extendedResult = await this.queryExercises(EXTENDED_EXERCISE_SELECT, filters);

    if (!this.isMissingColumnError(extendedResult.error)) {
      return extendedResult;
    }

    const baseResult = await this.queryExercises(BASE_EXERCISE_SELECT, filters);
    const fallbackNote = 'Exercise metadata migration 002_extend_exercises.sql may not be applied yet.';

    return {
      data: baseResult.data,
      error: baseResult.error ? `${baseResult.error} ${fallbackNote}` : null,
    };
  }

  private async queryExercises(
    selectColumns: string,
    filters: {
      categoryId?: string;
      searchQuery?: string;
    },
  ): Promise<ExerciseServiceResult<Exercise[]>> {
    if (filters.categoryId) {
      const { data, error } = await this.supabase
        .from('exercises')
        .select(selectColumns)
        .eq('category_id', filters.categoryId)
        .returns<ExerciseRow[]>()
        .order('name', { ascending: true });

      return {
        data: (data ?? []).map(mapExercise),
        error: this.formatError(error),
      };
    }

    if (filters.searchQuery) {
      const { data, error } = await this.supabase
        .from('exercises')
        .select(selectColumns)
        .ilike('name', `%${filters.searchQuery}%`)
        .returns<ExerciseRow[]>()
        .order('name', { ascending: true });

      return {
        data: (data ?? []).map(mapExercise),
        error: this.formatError(error),
      };
    }

    const { data, error } = await this.supabase
      .from('exercises')
      .select(selectColumns)
      .returns<ExerciseRow[]>()
      .order('name', { ascending: true });

    return {
      data: (data ?? []).map(mapExercise),
      error: this.formatError(error),
    };
  }

  private isMissingColumnError(error: string | null): boolean {
    return error?.toLowerCase().includes('column') === true;
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
    muscleGroups: row.muscle_groups ?? [],
    equipment: row.equipment,
    trainingType: row.training_type ?? null,
    exerciseType: row.exercise_type ?? null,
    progressionGroup: row.progression_group ?? null,
    progressionLevel: row.progression_level ?? null,
    defaultUnit: row.default_unit ?? null,
    supportsWeight: row.supports_weight ?? false,
    supportsAssistance: row.supports_assistance ?? false,
    supportsDuration: row.supports_duration ?? false,
    supportsDistance: row.supports_distance ?? false,
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
