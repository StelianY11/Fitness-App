import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import { ExerciseHistoryWorkout } from '../../shared/models/fitness.models';

@Component({
  selector: 'app-exercise-history',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('exerciseHistory') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ exerciseName }}</h2>
          <p class="mt-2 text-sm leading-5 text-slate-600">{{ t('exerciseHistoryDescription') }}</p>
        </div>

        <a
          routerLink="/exercises"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('exerciseLibrary') }}
        </a>
      </header>

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('unableToLoadHistory') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          <button
            type="button"
            (click)="loadExerciseHistory()"
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else if (history.length === 0) {
        <div class="app-card bg-slate-50 p-5 text-center shadow-none">
          <p class="font-semibold text-slate-800">{{ t('noExerciseHistory') }}</p>
          <p class="mt-1 text-sm text-slate-600">
            {{ t('noExerciseHistoryDescription') }}
          </p>
        </div>
      } @else {
        <section class="app-card border-green-200 bg-green-50 space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('lastWorkout') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ history[0].workoutName }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ formatDate(history[0].workoutDate) }}</p>
            </div>
            <span class="app-badge bg-green-100 text-green-800 shrink-0">
              {{ history[0].sets.length }} {{ t('sets') }}
            </span>
          </div>

          <div class="space-y-2 border-t border-green-200 pt-3">
            @for (set of history[0].sets; track set.id) {
              <div class="rounded-md border border-green-200 bg-white px-3 py-2.5 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-semibold text-slate-950">{{ t('sets') }} {{ set.setNumber }}</p>
                  <p class="shrink-0 font-bold text-slate-700">{{ formatSet(set) }}</p>
                </div>
                @if (set.notes) {
                  <p class="mt-2 border-t border-slate-200 pt-2 text-slate-600">{{ set.notes }}</p>
                }
              </div>
            }
          </div>
        </section>

        <div class="space-y-3">
          @for (workout of history; track workout.workoutSessionId) {
            <article class="app-card space-y-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-lg font-bold leading-6 text-slate-950">{{ workout.workoutName }}</h3>
                  <p class="mt-1 text-sm leading-5 text-slate-600">{{ formatDate(workout.workoutDate) }}</p>
                </div>
                <span class="app-badge shrink-0">
                  {{ workout.sets.length }} {{ t('sets') }}
                </span>
              </div>

              <div class="space-y-2 border-t border-slate-200 pt-3">
                @for (set of workout.sets; track set.id) {
                  <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
                    <div class="flex items-center justify-between gap-3">
                      <p class="font-semibold text-slate-950">{{ t('sets') }} {{ set.setNumber }}</p>
                      <p class="shrink-0 font-bold text-slate-700">{{ formatSet(set) }}</p>
                    </div>
                    @if (set.notes) {
                      <p class="mt-2 border-t border-slate-200 pt-2 text-slate-600">{{ set.notes }}</p>
                    }
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class ExerciseHistoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  history: ExerciseHistoryWorkout[] = [];
  exerciseName = this.t('exercise');
  isLoading = true;
  errorMessage = '';

  private readonly exerciseId = this.route.snapshot.paramMap.get('exerciseId');
  private loadRunId = 0;

  t(key: string): string {
    return this.translationService.translate(key);
  }

  constructor() {
    void this.loadExerciseHistory();
  }

  async loadExerciseHistory(): Promise<void> {
    const loadId = this.loadRunId + 1;
    this.loadRunId = loadId;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (!this.exerciseId) {
        throw new Error('Exercise id is missing.');
      }

      const result = await this.liveWorkoutService.getExerciseHistory(this.exerciseId);

      if (result.error) {
        throw new Error(result.error);
      }

      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.history = result.data;
      this.exerciseName = result.data[0]?.exerciseName ?? this.t('exercise');
    } catch (error) {
      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.history = [];
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load exercise history.';
      console.error('Exercise history load failed:', error);
    } finally {
      if (!this.isStaleLoad(loadId)) {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  formatSet(set: ExerciseHistoryWorkout['sets'][number]): string {
    const pieces = [
      set.weightKg === null ? null : `${set.weightKg} kg`,
      set.reps === null ? null : `${set.reps} reps`,
      set.durationSeconds === null ? null : `${set.durationSeconds}s`,
      set.assistanceKg === null ? null : `${set.assistanceKg} kg assistance`,
      set.assistanceType,
    ].filter(Boolean);

    return pieces.length > 0 ? pieces.join(' / ') : this.t('saved');
  }

  private isStaleLoad(loadId: number): boolean {
    return this.loadRunId !== loadId;
  }
}
