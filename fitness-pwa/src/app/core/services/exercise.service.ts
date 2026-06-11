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
    isBuiltin: row.is_builtin,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
