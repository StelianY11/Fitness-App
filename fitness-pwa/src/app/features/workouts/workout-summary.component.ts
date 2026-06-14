import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkoutTemplateService } from '../../core/services/workout-template.service';
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
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('workoutSummary') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ workoutTitle }}</h2>
          @if (session) {
            <p class="mt-2 text-sm leading-5 text-slate-600">
              {{ t('finished') }} {{ session.finishedAt ? formatDate(session.finishedAt) : t('notFinished') }}
            </p>
          }
        </div>

        <a
          routerLink="/dashboard"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('dashboard') }}
        </a>
      </header>

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
        <section class="app-card space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('completed') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ workoutTitle }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">
                {{ t('duration') }} {{ workoutDuration }}
              </p>
            </div>
            <span class="app-badge bg-green-100 text-green-800">
              {{ session.status }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center">
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-lg font-bold text-slate-950">{{ workoutExercises.length }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-lg font-bold text-slate-950">{{ totalSets }}</p>
              <p class="mt-1 text-xs font-medium text-slate-500">{{ t('sets') }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-lg font-bold text-slate-950">{{ totalReps }}</p>
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
              <article class="app-card space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                      {{ t('exercises') }} {{ exerciseIndex + 1 }}
                    </p>
                    <h3 class="mt-1 text-lg font-bold leading-6 text-slate-950">
                      {{ getExerciseName(workoutExercise.exerciseId) }}
                    </h3>
                  </div>
                  <span class="app-badge">
                    {{ getSets(workoutExercise.id).length }} {{ t('sets') }}
                  </span>
                </div>

                @if (getSets(workoutExercise.id).length === 0) {
                  <div class="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    {{ t('noSetsLogged') }}
                  </div>
                } @else {
                  <div class="space-y-2 border-t border-slate-200 pt-3">
                    @for (set of getSets(workoutExercise.id); track set.id) {
                      <div class="rounded-md border border-slate-200 bg-white px-3 py-2.5">
                        <div class="flex items-center justify-between gap-3">
                          <p class="font-semibold text-slate-950">{{ t('sets') }} {{ set.setNumber }}</p>
                          <p class="shrink-0 text-sm font-bold text-slate-700">{{ formatSetSummary(set) }}</p>
                        </div>
                        @if (set.notes) {
                          <p class="mt-2 border-t border-slate-200 pt-2 text-sm leading-5 text-slate-600">{{ set.notes }}</p>
                        }
                      </div>
                    }
                  </div>
                }
              </article>
            }
          </div>
        }

        <div class="grid gap-3">
          <a
            routerLink="/dashboard"
            class="app-button app-button-primary"
          >
            {{ t('backToDashboard') }}
          </a>
          <a
            routerLink="/history"
            class="app-button app-button-secondary"
          >
            {{ t('viewHistory') }}
          </a>
          @if (session.workoutTemplateId) {
            <a
              [routerLink]="['/templates', session.workoutTemplateId]"
              class="app-button app-button-secondary"
            >
              {{ t('openTemplate') }}
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class WorkoutSummaryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  session: WorkoutSession | null = null;
  workoutExercises: WorkoutExercise[] = [];
  setsByExercise: Record<string, WorkoutSet[]> = {};
  exerciseNames: Record<string, string> = {};
  workoutName = '';
  isLoading = true;
  errorMessage = '';

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId');
  private loadRunId = 0;

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

  get workoutTitle(): string {
    return this.workoutName || this.t('workoutSession');
  }

  get workoutDuration(): string {
    if (!this.session?.finishedAt) {
      return '-';
    }

    const minutes = Math.max(
      1,
      Math.round((new Date(this.session.finishedAt).getTime() - new Date(this.session.startedAt).getTime()) / 60000),
    );

    return `${minutes} min`;
  }

  constructor() {
    void this.loadSummary();
  }

  async loadSummary(): Promise<void> {
    const loadId = this.loadRunId + 1;
    this.loadRunId = loadId;
    this.isLoading = true;
    this.errorMessage = '';
    this.session = null;
    this.workoutExercises = [];
    this.setsByExercise = {};
    this.workoutName = '';

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

      this.session = sessionResult.data;
      this.workoutExercises = exercisesResult.data;
      this.workoutName = sessionResult.data.workoutTemplateId ? this.t('templateWorkout') : this.t('workoutSession');
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
      void this.loadSummarySecondaryData(loadId, sessionResult.data, exercisesResult.data);
    } catch (error) {
      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.session = null;
      this.workoutExercises = [];
      this.setsByExercise = {};
      this.workoutName = '';
      this.errorMessage = getErrorMessage(error, 'Unable to load workout summary.');
      console.error('Workout summary load failed:', error);
    } finally {
      if (!this.isStaleLoad(loadId)) {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
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

  private async loadSummarySecondaryData(
    loadId: number,
    session: WorkoutSession,
    workoutExercises: WorkoutExercise[],
  ): Promise<void> {
    try {
      const [setsByExercise, exerciseNames, workoutName] = await Promise.all([
        this.loadSetsByExercise(workoutExercises),
        this.loadExerciseNames(),
        this.loadWorkoutName(session),
      ]);

      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.setsByExercise = setsByExercise;
      this.exerciseNames = exerciseNames;
      this.workoutName = workoutName;
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Workout summary secondary data load failed:', error);
    }
  }

  private async loadSetsByExercise(
    workoutExercises: WorkoutExercise[],
  ): Promise<Record<string, WorkoutSet[]>> {
    const entries = await Promise.all(
      workoutExercises.map(async (workoutExercise) => {
        const setsResult = await this.liveWorkoutService.getWorkoutSets(workoutExercise.id);

        if (setsResult.error) {
          console.error('Workout summary sets load error:', {
            workoutExerciseId: workoutExercise.id,
            error: setsResult.error,
          });
          return [workoutExercise.id, []] as const;
        }

        return [workoutExercise.id, setsResult.data] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  private async loadExerciseNames(): Promise<Record<string, string>> {
    try {
      const result = await this.exerciseService.getExercises();

      if (result.error) {
        console.error('Workout summary exercise metadata load error:', result.error);
      }

      return result.data.reduce<Record<string, string>>(
        (names, exercise: Exercise) => ({
          ...names,
          [exercise.id]: exercise.name,
        }),
        {},
      );
    } catch (error) {
      console.error('Workout summary exercise metadata load failed:', error);
      return {};
    }
  }

  private async loadWorkoutName(session: WorkoutSession): Promise<string> {
    if (!session.workoutTemplateId) {
      return this.t('workoutSession');
    }

    const result = await this.workoutTemplateService.getTemplateById(session.workoutTemplateId);

    if (result.error) {
      console.error('Workout summary template name load error:', result.error);
      return this.t('templateWorkout');
    }

    return result.data?.name ?? this.t('templateWorkout');
  }

  private isStaleLoad(loadId: number): boolean {
    return this.loadRunId !== loadId;
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
