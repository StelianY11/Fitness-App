import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import {
  Exercise,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from '../../shared/models/fitness.models';

interface SetForm {
  reps: string | number | null;
  weightKg: string | number | null;
  notes: string;
}

@Component({
  selector: 'app-live-workout',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">Live Workout</p>
          <h2 class="mt-2 text-3xl font-bold">Workout Session</h2>
          @if (session) {
            <p class="mt-2 text-sm text-slate-600">
              Started {{ formatDate(session.startedAt) }}
            </p>
          }
        </div>

        <a
          routerLink="/templates"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Templates
        </a>
      </div>

      @if (statusMessage) {
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {{ statusMessage }}
        </p>
      }

      @if (errorMessage) {
        <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p class="text-sm font-semibold text-red-800">Workout error</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
        </div>
      }

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (!session) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">Unable to load workout</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage || 'Workout session not found.' }}</p>
          <button
            type="button"
            (click)="loadLiveWorkout()"
            class="mt-4 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            Retry
          </button>
        </div>
      } @else {
        <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-medium text-slate-500">Status</p>
              <p class="mt-1 text-lg font-bold capitalize text-slate-950">{{ session.status }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              [class.bg-green-100]="session.status === 'active'"
              [class.text-green-800]="session.status === 'active'"
              [class.bg-slate-100]="session.status !== 'active'"
              [class.text-slate-700]="session.status !== 'active'"
            >
              {{ workoutExercises.length }} exercises
            </span>
          </div>
        </section>

        @if (workoutExercises.length === 0) {
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
            <p class="font-semibold text-slate-800">No exercises copied</p>
            <p class="mt-1 text-sm text-slate-600">
              This template does not have exercises yet.
            </p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (workoutExercise of workoutExercises; track workoutExercise.id; let exerciseIndex = $index) {
              <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wide text-green-700">
                      Exercise {{ exerciseIndex + 1 }}
                    </p>
                    <h3 class="mt-1 text-lg font-bold text-slate-950">
                      {{ getExerciseName(workoutExercise.exerciseId) }}
                    </h3>
                    @if (workoutExercise.notes) {
                      <p class="mt-1 text-sm text-slate-600">{{ workoutExercise.notes }}</p>
                    }
                  </div>
                  <button
                    type="button"
                    (click)="openSetForm(workoutExercise.id)"
                    [disabled]="session.status !== 'active' || savingSetExerciseId === workoutExercise.id"
                    class="rounded-md border border-green-600 px-3 py-2 text-sm font-semibold text-green-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  >
                    Add Set
                  </button>
                </div>

                @if (getSets(workoutExercise.id).length === 0) {
                  <div class="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    No sets logged yet.
                  </div>
                } @else {
                  <div class="mt-4 space-y-2">
                    @for (set of getSets(workoutExercise.id); track set.id) {
                      <div class="rounded-md border border-slate-200 p-3">
                        <div class="flex items-center justify-between gap-3">
                          <p class="font-semibold text-slate-950">Set {{ set.setNumber }}</p>
                          <p class="text-sm text-slate-600">
                            {{ formatSetSummary(set) }}
                          </p>
                        </div>
                        @if (set.notes) {
                          <p class="mt-2 text-sm text-slate-600">{{ set.notes }}</p>
                        }
                      </div>
                    }
                  </div>
                }

                @if (activeSetFormExerciseId === workoutExercise.id) {
                  <form
                    class="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                    (ngSubmit)="submitSet(workoutExercise)"
                  >
                    <div class="grid grid-cols-2 gap-3">
                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">Reps</span>
                        <input
                          type="number"
                          min="0"
                          name="reps"
                          [(ngModel)]="setForm.reps"
                          class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </label>

                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">Weight</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          name="weightKg"
                          [(ngModel)]="setForm.weightKg"
                          class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </label>
                    </div>

                    <label class="block">
                      <span class="text-sm font-medium text-slate-700">Notes</span>
                      <textarea
                        name="setNotes"
                        [(ngModel)]="setForm.notes"
                        rows="2"
                        class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      ></textarea>
                    </label>

                    <div class="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        (click)="closeSetForm()"
                        class="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        [disabled]="savingSetExerciseId === workoutExercise.id"
                        class="rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {{ savingSetExerciseId === workoutExercise.id ? 'Saving...' : 'Save Set' }}
                      </button>
                    </div>
                  </form>
                }
              </article>
            }
          </div>
        }

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            (click)="cancelWorkout()"
            [disabled]="isCancelling || isFinishing || session.status !== 'active'"
            class="rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {{ isCancelling ? 'Cancelling...' : 'Cancel Workout' }}
          </button>
          <button
            type="button"
            (click)="finishWorkout()"
            [disabled]="isFinishing || isCancelling || session.status !== 'active'"
            class="rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {{ isFinishing ? 'Finishing...' : 'Finish Workout' }}
          </button>
        </div>
      }
    </div>
  `,
})
export class LiveWorkoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  readonly loadingCards = [1, 2, 3];

  session: WorkoutSession | null = null;
  workoutExercises: WorkoutExercise[] = [];
  setsByExercise: Record<string, WorkoutSet[]> = {};
  exerciseNames: Record<string, string> = {};
  activeSetFormExerciseId: string | null = null;
  setForm: SetForm = createEmptySetForm();
  isLoading = true;
  savingSetExerciseId: string | null = null;
  isFinishing = false;
  isCancelling = false;
  errorMessage = '';
  statusMessage = '';

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId');

  constructor() {
    void this.loadLiveWorkout();
  }

  async loadLiveWorkout(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      if (!this.sessionId) {
        throw new Error('Workout session id is missing.');
      }

      const sessionResult = await this.liveWorkoutService.getWorkoutSessionById(this.sessionId);

      if (sessionResult.error || !sessionResult.data) {
        console.error('Live workout session load error:', {
          sessionId: this.sessionId,
          error: sessionResult.error ?? 'Workout session not found.',
        });
        throw new Error(sessionResult.error ?? 'Workout session not found.');
      }

      const exercisesResult = await this.liveWorkoutService.getWorkoutExercises(sessionResult.data.id);

      if (exercisesResult.error) {
        console.error('Live workout exercises load error:', {
          sessionId: sessionResult.data.id,
          error: exercisesResult.error,
        });
        throw new Error(exercisesResult.error);
      }

      const nextSetsByExercise: Record<string, WorkoutSet[]> = {};

      for (const workoutExercise of exercisesResult.data) {
        const setsResult = await this.liveWorkoutService.getWorkoutSets(workoutExercise.id);

        if (setsResult.error) {
          console.error('Live workout sets load error:', {
            workoutExerciseId: workoutExercise.id,
            error: setsResult.error,
          });
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
      this.errorMessage = getErrorMessage(error, 'Unable to load workout.');
      console.error('Live workout load failed:', error);
    } finally {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  openSetForm(workoutExerciseId: string): void {
    this.activeSetFormExerciseId = workoutExerciseId;
    this.setForm = createEmptySetForm();
    this.errorMessage = '';
    this.statusMessage = '';
  }

  closeSetForm(): void {
    this.activeSetFormExerciseId = null;
    this.setForm = createEmptySetForm();
  }

  async submitSet(workoutExercise: WorkoutExercise): Promise<void> {
    if (this.savingSetExerciseId || this.session?.status !== 'active') {
      return;
    }

    const reps = parseNullableNumber(this.setForm.reps, 'Reps');
    const weightKg = parseNullableNumber(this.setForm.weightKg, 'Weight');

    if (typeof reps === 'string') {
      this.errorMessage = reps;
      return;
    }

    if (typeof weightKg === 'string') {
      this.errorMessage = weightKg;
      return;
    }

    const notes = this.setForm.notes.trim();

    if (reps === null && weightKg === null && !notes) {
      this.errorMessage = 'Add reps, weight, or notes before saving a set.';
      return;
    }

    this.savingSetExerciseId = workoutExercise.id;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.liveWorkoutService.addSet(workoutExercise.id, {
        reps,
        weightKg,
        notes: notes || null,
      });

      if (result.error || !result.data) {
        console.error('Live workout set insert rejected:', {
          workoutExerciseId: workoutExercise.id,
          workoutSessionId: workoutExercise.workoutSessionId,
          exerciseId: workoutExercise.exerciseId,
          error: result.error ?? 'No set returned.',
        });
        throw new Error(result.error ?? 'Unable to save set.');
      }

      this.setsByExercise = {
        ...this.setsByExercise,
        [workoutExercise.id]: [...this.getSets(workoutExercise.id), result.data].sort(
          (a, b) => a.setNumber - b.setNumber,
        ),
      };
      this.statusMessage = 'Set saved.';
      this.closeSetForm();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to save set.');
      console.error('Live workout add set failed:', error);
    } finally {
      this.savingSetExerciseId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  async finishWorkout(): Promise<void> {
    if (!this.session || this.isFinishing) {
      return;
    }

    this.isFinishing = true;
    this.errorMessage = '';

    try {
      const result = await this.liveWorkoutService.finishWorkout(this.session.id);

      if (result.error) {
        throw new Error(result.error);
      }

      await this.router.navigate(['/workout/summary', this.session.id]);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to finish workout.');
      console.error('Live workout finish failed:', error);
    } finally {
      this.isFinishing = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async cancelWorkout(): Promise<void> {
    if (!this.session || this.isCancelling || !confirm('Cancel this workout?')) {
      return;
    }

    this.isCancelling = true;
    this.errorMessage = '';

    try {
      const result = await this.liveWorkoutService.cancelWorkout(this.session.id);

      if (result.error) {
        throw new Error(result.error);
      }

      await this.router.navigateByUrl('/templates');
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to cancel workout.');
      console.error('Live workout cancel failed:', error);
    } finally {
      this.isCancelling = false;
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
        console.error('Live workout exercise metadata load error:', result.error);
      }

      this.exerciseNames = result.data.reduce<Record<string, string>>(
        (names, exercise: Exercise) => ({
          ...names,
          [exercise.id]: exercise.name,
        }),
        {},
      );
    } catch (error) {
      console.error('Live workout exercise metadata load failed:', error);
    }
  }
}

function createEmptySetForm(): SetForm {
  return {
    reps: '',
    weightKg: '',
    notes: '',
  };
}

function parseNullableNumber(
  value: string | number | null | undefined,
  label: string,
): number | null | string {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : `${label} must be a valid number.`;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isNaN(parsedValue) ? `${label} must be a valid number.` : parsedValue;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
