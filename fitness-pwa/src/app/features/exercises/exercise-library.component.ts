import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { TranslationService } from '../../core/services/translation.service';
import {
  Exercise,
  ExerciseCategory,
} from '../../shared/models/fitness.models';

@Component({
  selector: 'app-exercise-library',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('exerciseLibrary') }}</p>
          <h2 class="mt-2 text-3xl font-bold">{{ t('exerciseLibrary') }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ t('exerciseLibraryDescription') }}</p>
        </div>

        <a
          routerLink="/dashboard"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('back') }}
        </a>
      </div>

      <label class="block">
        <span class="text-sm font-medium text-slate-700">{{ t('search') }}</span>
        <input
          type="search"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearchChange($event)"
          [placeholder]="t('searchExercises')"
          class="app-input mt-2"
        />
      </label>

      <div class="-mx-5 overflow-x-auto px-5">
        <div class="flex min-w-max gap-2 pb-1">
          <button
            type="button"
            (click)="selectCategory(null)"
            class="app-chip"
            [class.border-green-600]="selectedCategoryId === null"
            [class.bg-green-600]="selectedCategoryId === null"
            [class.text-white]="selectedCategoryId === null"
            [class.border-slate-200]="selectedCategoryId !== null"
            [class.text-slate-700]="selectedCategoryId !== null"
          >
            {{ t('all') }}
          </button>

          @for (category of categories; track category.id) {
            <button
              type="button"
              (click)="selectCategory(category.id)"
              class="app-chip"
              [class.border-green-600]="selectedCategoryId === category.id"
              [class.bg-green-600]="selectedCategoryId === category.id"
              [class.text-white]="selectedCategoryId === category.id"
              [class.border-slate-200]="selectedCategoryId !== category.id"
              [class.text-slate-700]="selectedCategoryId !== category.id"
            >
              {{ category.name }}
            </button>
          }
        </div>
      </div>

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('unableToLoadExercises') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          <button
            type="button"
            (click)="loadExerciseLibrary()"
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else if (filteredExercises.length === 0) {
        <div class="app-card bg-slate-50 p-5 text-center shadow-none">
          <p class="font-semibold text-slate-800">{{ t('noExercisesFound') }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ t('search') }}</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (exercise of filteredExercises; track exercise.id) {
            <article class="app-card">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-green-700">
                    {{ getCategoryName(exercise.categoryId) }}
                  </p>
                  <h3 class="mt-1 text-lg font-bold text-slate-950">{{ exercise.name }}</h3>
                </div>
                <span class="app-badge">
                  {{ getDifficulty(exercise) }}
                </span>
              </div>

              <p class="mt-3 text-sm text-slate-600">
                {{ exercise.description || t('noDescription') }}
              </p>

              <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div class="rounded-md bg-slate-50 p-3">
                  <p class="text-xs font-medium text-slate-500">{{ t('primaryMuscle') }}</p>
                  <p class="mt-1 font-semibold text-slate-900">{{ getPrimaryMuscle(exercise) }}</p>
                </div>
                <div class="rounded-md bg-slate-50 p-3">
                  <p class="text-xs font-medium text-slate-500">{{ t('equipment') }}</p>
                  <p class="mt-1 font-semibold text-slate-900">{{ exercise.equipment || t('noEquipment') }}</p>
                </div>
              </div>

              <a
                [routerLink]="['/exercises', exercise.id, 'history']"
                class="app-button app-button-secondary mt-4"
              >
                {{ t('history') }}
              </a>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class ExerciseLibraryComponent {
  private readonly exerciseService = inject(ExerciseService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  categories: ExerciseCategory[] = [];
  exercises: Exercise[] = [];
  filteredExercises: Exercise[] = [];
  selectedCategoryId: string | null = null;
  searchQuery = '';
  isLoading = true;
  errorMessage = '';

  constructor() {
    void this.loadExerciseLibrary();
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilters();
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  private applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredExercises = this.exercises.filter((exercise) => {
      const matchesCategory =
        this.selectedCategoryId === null || exercise.categoryId === this.selectedCategoryId;
      const searchableText = [
        exercise.name,
        exercise.description ?? '',
        exercise.equipment ?? '',
        ...exercise.muscleGroups,
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }

  getCategoryName(categoryId: string | null): string {
    return this.categories.find((category) => category.id === categoryId)?.name ?? this.t('general');
  }

  getPrimaryMuscle(exercise: Exercise): string {
    return exercise.muscleGroups[0] ?? this.t('general');
  }

  getDifficulty(exercise: Exercise): string {
    const equipment = exercise.equipment?.toLowerCase() ?? '';

    if (equipment === 'bodyweight' || equipment === 'none') {
      return this.t('beginner');
    }

    if (equipment.includes('barbell') || equipment.includes('pull-up')) {
      return this.t('advanced');
    }

    return this.t('intermediate');
  }

  async loadExerciseLibrary(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [categoriesResult, exercisesResult] = await Promise.all([
        this.exerciseService.getCategories(),
        this.exerciseService.getExercises(),
      ]);

      this.categories = categoriesResult.data;
      this.exercises = exercisesResult.data;
      this.errorMessage = categoriesResult.error ?? exercisesResult.error ?? '';

      if (this.selectedCategoryId && !this.categories.some((category) => category.id === this.selectedCategoryId)) {
        this.selectedCategoryId = null;
      }

      this.applyFilters();

      if (this.errorMessage) {
        console.error('Exercise library load error:', this.errorMessage);
      }
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Unable to load the exercise library.';
      console.error('Exercise library load failed:', error);
    } finally {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }
}
