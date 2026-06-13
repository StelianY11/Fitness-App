import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkoutTemplateService } from '../../core/services/workout-template.service';
import {
  Exercise,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutTemplate,
} from '../../shared/models/fitness.models';

@Component({
  selector: 'app-workout-detail',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('workoutDetails') }}</p>
          <h2 class="mt-2 text-3xl font-bold">{{ workoutName }}</h2>
          @if (session) {
            <p class="mt-2 text-sm text-slate-600">
              {{ formatDateTime(session.startedAt) }}
            </p>
          }
        </div>

        <a
          routerLink="/history"
          class="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {{ t('back') }}
        </a>
      </div>

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('unableToLoadWorkout') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          <button
            type="button"
            (click)="loadWorkout()"
            class="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else if (session) {
        <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('started') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ formatDateTime(session.startedAt) }}</p>
            </div>
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('finished') }}</p>
              <p class="mt-1 font-semibold text-slate-950">
                {{ session.finishedAt ? formatDateTime(session.finishedAt) : 'Open' }}
              </p>
            </div>
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('duration') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ formatDuration(session) }}</p>
            </div>
            <div class="rounded-md bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('status') }}</p>
              <p class="mt-1 font-semibold capitalize text-slate-950">{{ session.status }}</p>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled
            class="min-h-12 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-400"
          >
            {{ t('resumeWorkout') }}
          </button>
          @if (session.workoutTemplateId) {
            <a
              [routerLink]="['/templates', session.workoutTemplateId]"
              class="inline-flex min-h-12 items-center justify-center rounded-md bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white"
            >
              {{ t('templates') }}
            </a>
          } @else {
            <span class="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-400">
              No Template
            </span>
          }
        </div>

        <button
          type="button"
          (click)="deleteWorkout()"
          [disabled]="isDeleting"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {{ isDeleting ? t('loading') : t('deleteWorkout') }}
        </button>

        @if (workoutExercises.length === 0) {
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
            <p class="font-semibold text-slate-800">{{ t('noExercisesFound') }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ t('noExercisesFound') }}</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (workoutExercise of workoutExercises; track workoutExercise.id; let exerciseIndex = $index) {
              <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-green-700">
                      {{ t('exercises') }} {{ exerciseIndex + 1 }}
                    </p>
                    <h3 class="mt-1 text-lg font-bold text-slate-950">
                      {{ getExerciseName(workoutExercise.exerciseId) }}
                    </h3>
                  </div>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
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
      }
    </div>
  `,
})
export class WorkoutDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  session: WorkoutSession | null = null;
  workoutName = 'Workout';
  workoutExercises: WorkoutExercise[] = [];
  setsByExercise: Record<string, WorkoutSet[]> = {};
  exerciseNames: Record<string, string> = {};
  isLoading = true;
  isDeleting = false;
  errorMessage = '';

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId');

  t(key: string): string {
    return this.translationService.translate(key);
  }

  constructor() {
    void this.loadWorkout();
  }

  async loadWorkout(): Promise<void> {
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
      await Promise.all([
        this.loadWorkoutName(sessionResult.data),
        this.loadExerciseNames(),
      ]);
    } catch (error) {
      this.session = null;
      this.workoutExercises = [];
      this.setsByExercise = {};
      this.errorMessage = getErrorMessage(error, 'Unable to load workout.');
      console.error('Workout detail load failed:', error);
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
      set.weightKg === null ? null : `${set.weightKg} kg`,
      set.reps === null ? null : `${set.reps} reps`,
      set.assistanceKg === null ? null : `${set.assistanceKg} kg assistance`,
      set.durationSeconds === null ? null : `${set.durationSeconds}s`,
      set.distanceMeters === null ? null : `${set.distanceMeters}m`,
    ].filter(Boolean);

    return pieces.length > 0 ? pieces.join(' / ') : 'Logged';
  }

  formatDateTime(value: string): string {
    return new Date(value).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  formatDuration(session: WorkoutSession): string {
    if (!session.finishedAt) {
      return 'Open';
    }

    const minutes = Math.max(
      1,
      Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000),
    );

    return `${minutes} min`;
  }

  async deleteWorkout(): Promise<void> {
    if (!this.session || this.isDeleting || !confirm(this.t('confirmDeleteWorkout'))) {
      return;
    }

    this.isDeleting = true;
    this.errorMessage = '';

    try {
      const result = await this.liveWorkoutService.deleteWorkoutSession(this.session.id);

      if (result.error) {
        throw new Error(result.error);
      }

      await this.router.navigateByUrl('/history');
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to delete workout.');
      console.error('Workout detail delete failed:', error);
    } finally {
      this.isDeleting = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadWorkoutName(session: WorkoutSession): Promise<void> {
    if (!session.workoutTemplateId) {
      this.workoutName = 'Workout';
      return;
    }

    const templateResult = await this.workoutTemplateService.getTemplateById(session.workoutTemplateId);

    if (templateResult.error) {
      console.error('Workout detail template load error:', templateResult.error);
      this.workoutName = 'Template Workout';
      return;
    }

    const template = templateResult.data as WorkoutTemplate | null;
    this.workoutName = template?.name ?? 'Template Workout';
  }

  private async loadExerciseNames(): Promise<void> {
    const exercisesResult = await this.exerciseService.getExercises();

    if (exercisesResult.error) {
      console.error('Workout detail exercise metadata load error:', exercisesResult.error);
    }

    this.exerciseNames = exercisesResult.data.reduce<Record<string, string>>(
      (names, exercise: Exercise) => ({
        ...names,
        [exercise.id]: exercise.name,
      }),
      {},
    );
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
