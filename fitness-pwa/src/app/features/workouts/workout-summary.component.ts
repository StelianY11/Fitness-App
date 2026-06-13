import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import {
  Exercise,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../../shared/models/fitness.models';

@Component({
  selector: 'app-workout-summary',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('workoutSummary') }}</p>
          <h2 class="mt-2 text-3xl font-bold">{{ t('workoutSummary') }}</h2>
          @if (session) {
            <p class="mt-2 text-sm text-slate-600">
              {{ formatDate(session.startedAt) }} - {{ session.finishedAt ? formatDate(session.finishedAt) : 'Not finished' }}
            </p>
          }
        </div>

        <a
          routerLink="/dashboard"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('dashboard') }}
        </a>
      </div>

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-28 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('unableToLoadSummary') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          <button
            type="button"
            (click)="loadSummary()"
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else if (session) {
        <section class="app-card">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-medium text-slate-500">{{ t('status') }}</p>
              <p class="mt-1 text-lg font-bold capitalize text-slate-950">{{ session.status }}</p>
            </div>
            <span class="app-badge bg-green-100 text-green-800">
              {{ totalSets }} {{ t('sets') }}
            </span>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xl font-bold text-slate-950">{{ workoutExercises.length }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
            </div>
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xl font-bold text-slate-950">{{ totalSets }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500">{{ t('sets') }}</p>
            </div>
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xl font-bold text-slate-950">{{ totalReps }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500">{{ t('reps') }}</p>
            </div>
          </div>
        </section>

        @if (workoutExercises.length === 0) {
          <div class="app-card bg-slate-50 p-5 text-center shadow-none">
            <p class="font-semibold text-slate-800">{{ t('noExercisesFound') }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ t('noCopiedExercises') }}</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (workoutExercise of workoutExercises; track workoutExercise.id; let exerciseIndex = $index) {
              <article class="app-card">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-green-700">
                      {{ t('exercises') }} {{ exerciseIndex + 1 }}
                    </p>
                    <h3 class="mt-1 text-lg font-bold text-slate-950">
                      {{ getExerciseName(workoutExercise.exerciseId) }}
                    </h3>
                  </div>
                  <span class="app-badge">
                    {{ getSets(workoutExercise.id).length }} {{ t('sets') }}
                  </span>
                </div>

                @if (getSets(workoutExercise.id).length === 0) {
                  <div class="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    {{ t('noSetsLogged') }}
                  </div>
                } @else {
                  <div class="mt-4 space-y-2">
                    @for (set of getSets(workoutExercise.id); track set.id) {
                      <div class="rounded-md border border-slate-200 p-3">
                        <div class="flex items-center justify-between gap-3">
                          <p class="font-semibold text-slate-950">{{ t('sets') }} {{ set.setNumber }}</p>
                          <p class="text-sm text-slate-600">{{ formatSetSummary(set) }}</p>
                        </div>
                        @if (set.notes) {
                          <p class="mt-2 text-sm text-slate-600">{{ set.notes }}</p>
                        }
                      </div>
                    }
                  </div>
                }
              </article>
            }
          </div>
        }

        <div class="grid grid-cols-2 gap-3">
          <a
            routerLink="/templates"
            class="app-button app-button-secondary"
          >
            {{ t('templates') }}
          </a>
          <a
            routerLink="/dashboard"
            class="app-button app-button-primary"
          >
            {{ t('dashboard') }}
          </a>
        </div>
      }
    </div>
  `,
})
export class WorkoutSummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  session: WorkoutSession | null = null;
  workoutExercises: WorkoutExercise[] = [];
  setsByExercise: Record<string, WorkoutSet[]> = {};
  exerciseNames: Record<string, string> = {};
  isLoading = true;
  errorMessage = '';

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId');

  t(key: string): string {
    return this.translationService.translate(key);
  }

  get totalSets(): number {
    return Object.values(this.setsByExercise).reduce(
      (total, sets) => total + sets.length,
      0,
    );
  }

  get totalReps(): number {
    return Object.values(this.setsByExercise)
      .flat()
      .reduce((total, set) => total + (set.reps ?? 0), 0);
  }

  constructor() {
    void this.loadSummary();
  }

  async loadSummary(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (!this.sessionId) {
        throw new Error('Workout session id is missing.');
      }

      const sessionResult = await this.liveWorkoutService.getWorkoutSessionById(this.sessionId);

      if (sessionResult.error || !sessionResult.data) {
        throw new Error(sessionResult.error ?? 'Workout session not found.');
      }

      const exercisesResult = await this.liveWorkoutService.getWorkoutExercises(sessionResult.data.id);

      if (exercisesResult.error) {
        throw new Error(exercisesResult.error);
      }

      const nextSetsByExercise: Record<string, WorkoutSet[]> = {};

      for (const workoutExercise of exercisesResult.data) {
        const setsResult = await this.liveWorkoutService.getWorkoutSets(workoutExercise.id);

        if (setsResult.error) {
          throw new Error(setsResult.error);
        }

        nextSetsByExercise[workoutExercise.id] = setsResult.data;
      }

      this.session = sessionResult.data;
      this.workoutExercises = exercisesResult.data;
      this.setsByExercise = nextSetsByExercise;
      await this.loadExerciseNames();
    } catch (error) {
      this.session = null;
      this.workoutExercises = [];
      this.setsByExercise = {};
      this.errorMessage = getErrorMessage(error, 'Unable to load workout summary.');
      console.error('Workout summary load failed:', error);
    } finally {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  getSets(workoutExerciseId: string): WorkoutSet[] {
    return this.setsByExercise[workoutExerciseId] ?? [];
  }

  getExerciseName(exerciseId: string): string {
    return this.exerciseNames[exerciseId] ?? 'Exercise';
  }

  formatSetSummary(set: WorkoutSet): string {
    const pieces = [
      set.reps === null ? null : `${set.reps} reps`,
      set.weightKg === null ? null : `${set.weightKg} kg`,
    ].filter(Boolean);

    return pieces.length > 0 ? pieces.join(' / ') : 'Logged';
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  private async loadExerciseNames(): Promise<void> {
    try {
      const result = await this.exerciseService.getExercises();

      if (result.error) {
        console.error('Workout summary exercise metadata load error:', result.error);
      }

      this.exerciseNames = result.data.reduce<Record<string, string>>(
        (names, exercise: Exercise) => ({
          ...names,
          [exercise.id]: exercise.name,
        }),
        {},
      );
    } catch (error) {
      console.error('Workout summary exercise metadata load failed:', error);
    }
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
