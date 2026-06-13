import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import {
  LiveWorkoutPreFillSet,
  LiveWorkoutService,
} from '../../core/services/live-workout.service';
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

interface QuickSetForm extends SetForm {
  key: string;
  setNumber: number;
  source: LiveWorkoutPreFillSet['source'];
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
          class="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
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

      @if (showUnsavedPrefillWarning) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="max-h-[85vh] w-full overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-xl sm:max-w-lg">
            <h3 class="text-lg font-bold text-amber-950">You have unsaved suggested sets</h3>
            <p class="mt-2 text-sm text-amber-800">
              Save these rows before finishing, or cancel and keep editing.
            </p>

            <div class="mt-4 space-y-2">
              @for (item of finishUnsavedSuggestedSets; track item.quickSet.key) {
                <div class="rounded-md bg-white p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="font-semibold text-slate-950">
                        {{ getExerciseName(item.workoutExercise.exerciseId) }}
                      </p>
                      <p class="mt-1 text-sm text-slate-600">Set {{ item.quickSet.setNumber }}</p>
                    </div>
                    <span class="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                      {{ getPreFillSourceLabel(item.quickSet.source) }}
                    </span>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div class="rounded-md bg-slate-50 p-2">
                      <p class="text-xs font-medium text-slate-500">Weight</p>
                      <p class="mt-1 font-semibold text-slate-950">
                        {{ formatQuickSetWeight(item.quickSet) }}
                      </p>
                    </div>
                    <div class="rounded-md bg-slate-50 p-2">
                      <p class="text-xs font-medium text-slate-500">Reps</p>
                      <p class="mt-1 font-semibold text-slate-950">
                        {{ formatQuickSetReps(item.quickSet) }}
                      </p>
                    </div>
                  </div>

                  @if (item.quickSet.notes.trim()) {
                    <p class="mt-3 rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                      {{ item.quickSet.notes }}
                    </p>
                  }
                </div>
              }
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="saveAllSuggestedSetsAndFinish()"
                [disabled]="isSavingSuggestedSets || isFinishing"
                class="min-h-12 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {{ isSavingSuggestedSets ? 'Saving...' : 'Save all and finish' }}
              </button>
              <button
                type="button"
                (click)="closeUnsavedPrefillWarning()"
                class="min-h-12 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                Cancel and continue editing
              </button>
            </div>
          </div>
        </div>
      }

      @if (showFinishConfirmation) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-xl sm:max-w-lg">
            <h3 class="text-lg font-bold text-slate-950">Finish workout?</h3>
            <p class="mt-2 text-sm text-slate-600">
              Review what has been saved before ending this session.
            </p>

            @if (getTotalSavedSets() === 0) {
              <p class="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                This workout has no saved sets.
              </p>
            }

            <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div class="rounded-md bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">Exercises</p>
                <p class="mt-1 text-lg font-bold text-slate-950">{{ workoutExercises.length }}</p>
              </div>
              <div class="rounded-md bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">Saved sets</p>
                <p class="mt-1 text-lg font-bold text-slate-950">{{ getTotalSavedSets() }}</p>
              </div>
              <div class="rounded-md bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">Total reps</p>
                <p class="mt-1 text-lg font-bold text-slate-950">{{ getTotalSavedReps() }}</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="confirmFinishWorkout()"
                [disabled]="isFinishing"
                class="min-h-12 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {{ isFinishing ? 'Finishing...' : 'Finish Workout' }}
              </button>
              <button
                type="button"
                (click)="closeFinishConfirmation()"
                [disabled]="isFinishing"
                class="min-h-12 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                Continue editing
              </button>
            </div>
          </div>
        </div>
      }

      @if (isLoading && !hasCoreWorkoutData()) {
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
            class="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700"
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
                    class="inline-flex min-h-11 items-center justify-center rounded-md border border-green-600 px-3 py-2 text-sm font-semibold text-green-700 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  >
                    Add Set
                  </button>
                </div>

                <a
                  [routerLink]="['/exercises', workoutExercise.exerciseId, 'history']"
                  class="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  History
                </a>

                @if (getSets(workoutExercise.id).length > 0) {
                  <div class="mt-4 space-y-2">
                    @for (set of getSets(workoutExercise.id); track set.id) {
                      <div
                        class="rounded-md border p-3 transition"
                        [class.border-green-200]="wasRecentlySaved(set.id)"
                        [class.bg-green-50]="wasRecentlySaved(set.id)"
                        [class.border-slate-200]="!wasRecentlySaved(set.id)"
                        [class.bg-slate-50]="!wasRecentlySaved(set.id)"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <div>
                            <p class="text-xs font-bold uppercase tracking-wide text-green-700">
                              {{ wasRecentlySaved(set.id) ? 'Saved just now' : 'Saved' }}
                            </p>
                            <p class="mt-1 font-semibold text-slate-950">Set {{ set.setNumber }}</p>
                          </div>
                          <p class="text-base font-bold text-slate-950">
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

                @if (getQuickSetForms(workoutExercise.id).length > 0) {
                  <div class="mt-4 space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <p class="text-sm font-semibold text-amber-950">
                        Editable suggestions from {{ getPreFillSourceLabel(getQuickSetForms(workoutExercise.id)[0].source) }}
                      </p>
                      <p class="mt-1 text-xs text-amber-800">
                        Edit a row or press Save to log it for today.
                      </p>
                    </div>

                    @for (quickSet of getQuickSetForms(workoutExercise.id); track quickSet.key) {
                      <form
                        class="space-y-3 rounded-md border border-amber-100 bg-white p-3"
                        (ngSubmit)="submitQuickSet(workoutExercise, quickSet)"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <div>
                            <p class="text-xs font-bold uppercase tracking-wide text-amber-700">Editable</p>
                            <p class="mt-1 font-semibold text-slate-950">Set {{ quickSet.setNumber }}</p>
                          </div>
                          <p class="text-sm font-semibold text-slate-600">
                            {{ formatQuickSetSummary(quickSet) }}
                          </p>
                        </div>

                        @if (getSaveError(quickSet.key)) {
                          <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {{ getSaveError(quickSet.key) }}
                          </p>
                        }

                        <div class="grid grid-cols-2 gap-3">
                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">Weight</span>
                            <input
                              [id]="'quickWeight' + quickSet.key"
                              type="number"
                              min="0"
                              step="0.5"
                              [name]="'quickWeight' + quickSet.key"
                              [(ngModel)]="quickSet.weightKg"
                              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-4 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                          </label>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">Reps</span>
                            <input
                              [id]="'quickReps' + quickSet.key"
                              type="number"
                              min="0"
                              [name]="'quickReps' + quickSet.key"
                              [(ngModel)]="quickSet.reps"
                              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-4 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                          </label>
                        </div>

                        <label class="block">
                          <span class="text-sm font-medium text-slate-700">Notes</span>
                          <textarea
                            [id]="'quickNotes' + quickSet.key"
                            [name]="'quickNotes' + quickSet.key"
                            [(ngModel)]="quickSet.notes"
                            rows="2"
                            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                          ></textarea>
                        </label>

                        <button
                          type="submit"
                          [disabled]="savingSetExerciseId === quickSet.key || isSavingSuggestedSets"
                          class="min-h-12 w-full rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {{ savingSetExerciseId === quickSet.key ? 'Saving...' : 'Save Set' }}
                        </button>
                      </form>
                    }
                  </div>
                } @else if (getSets(workoutExercise.id).length === 0) {
                  <div class="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    No sets logged yet.
                  </div>
                }

                @if (activeSetFormExerciseId === workoutExercise.id) {
                  <form
                    class="mt-4 space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                    (ngSubmit)="submitSet(workoutExercise)"
                  >
                    @if (getSaveError(workoutExercise.id)) {
                      <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {{ getSaveError(workoutExercise.id) }}
                      </p>
                    }

                    <div class="grid grid-cols-2 gap-3">
                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">Weight</span>
                        <input
                          [id]="'weightKg' + workoutExercise.id"
                          type="number"
                          min="0"
                          step="0.5"
                          [name]="'weightKg' + workoutExercise.id"
                          [(ngModel)]="setForm.weightKg"
                          class="mt-2 w-full rounded-md border border-slate-300 px-3 py-4 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </label>

                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">Reps</span>
                        <input
                          [id]="'reps' + workoutExercise.id"
                          type="number"
                          min="0"
                          [name]="'reps' + workoutExercise.id"
                          [(ngModel)]="setForm.reps"
                          class="mt-2 w-full rounded-md border border-slate-300 px-3 py-4 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </label>
                    </div>

                    <label class="block">
                      <span class="text-sm font-medium text-slate-700">Notes</span>
                      <textarea
                        [id]="'setNotes' + workoutExercise.id"
                        [name]="'setNotes' + workoutExercise.id"
                        [(ngModel)]="setForm.notes"
                        rows="2"
                        class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      ></textarea>
                    </label>

                    <div class="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        (click)="closeSetForm()"
                        class="min-h-12 rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        [disabled]="savingSetExerciseId === workoutExercise.id"
                        class="min-h-12 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
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
            class="min-h-12 rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {{ isCancelling ? 'Cancelling...' : 'Cancel Workout' }}
          </button>
          <button
            type="button"
            (click)="finishWorkout()"
            [disabled]="isFinishing || isCancelling || session.status !== 'active'"
            class="min-h-12 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
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
  quickSetFormsByExercise: Record<string, QuickSetForm[]> = {};
  finishUnsavedSuggestedSets: Array<{ workoutExercise: WorkoutExercise; quickSet: QuickSetForm }> = [];
  exerciseNames: Record<string, string> = {};
  saveErrors: Record<string, string> = {};
  recentlySavedSetIds: string[] = [];
  activeSetFormExerciseId: string | null = null;
  setForm: SetForm = createEmptySetForm();
  isLoading = true;
  savingSetExerciseId: string | null = null;
  isFinishing = false;
  isCancelling = false;
  isSavingSuggestedSets = false;
  isPrefillLoading = false;
  showUnsavedPrefillWarning = false;
  showFinishConfirmation = false;
  errorMessage = '';
  statusMessage = '';

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId');
  private loadRunId = 0;
  private loadingSafetyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadLiveWorkout();
  }

  async loadLiveWorkout(): Promise<void> {
    const loadId = this.loadRunId + 1;
    this.loadRunId = loadId;
    this.isLoading = true;
    this.errorMessage = '';
    this.statusMessage = '';
    this.isPrefillLoading = false;
    this.session = null;
    this.workoutExercises = [];
    this.setsByExercise = {};
    this.quickSetFormsByExercise = {};
    this.finishUnsavedSuggestedSets = [];
    this.saveErrors = {};
    this.recentlySavedSetIds = [];
    this.clearLoadingSafetyTimeout();
    this.loadingSafetyTimeout = setTimeout(() => {
      if (this.loadRunId !== loadId || !this.isLoading) {
        return;
      }

      this.isLoading = false;
      this.errorMessage = 'Workout is taking too long to load. Please retry.';
      console.error('Live workout load timed out:', {
        sessionId: this.sessionId,
        loadId,
      });
      this.changeDetectorRef.detectChanges();
    }, 8000);

    try {
      if (!this.sessionId) {
        throw new Error('Workout session id is missing.');
      }

      const sessionResult = await this.liveWorkoutService.getWorkoutSessionById(this.sessionId);

      if (this.isStaleLoad(loadId)) {
        return;
      }

      if (sessionResult.error || !sessionResult.data) {
        console.error('Live workout session load error:', {
          sessionId: this.sessionId,
          error: sessionResult.error ?? 'Workout session not found.',
        });
        throw new Error(sessionResult.error ?? 'Workout session not found.');
      }

      const exercisesResult = await this.liveWorkoutService.getWorkoutExercises(sessionResult.data.id);

      if (this.isStaleLoad(loadId)) {
        return;
      }

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

        if (this.isStaleLoad(loadId)) {
          return;
        }

        if (setsResult.error) {
          console.error('Live workout sets load error:', {
            workoutExerciseId: workoutExercise.id,
            error: setsResult.error,
          });
          throw new Error(setsResult.error);
        }

        nextSetsByExercise[workoutExercise.id] = setsResult.data;
      }

      this.errorMessage = '';
      this.session = sessionResult.data;
      this.workoutExercises = exercisesResult.data;
      this.setsByExercise = nextSetsByExercise;
      this.isLoading = false;
      this.clearLoadingSafetyTimeout();
      this.changeDetectorRef.detectChanges();
      void this.loadSecondaryWorkoutData(loadId, exercisesResult.data, nextSetsByExercise);
    } catch (error) {
      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.session = null;
      this.workoutExercises = [];
      this.setsByExercise = {};
      this.quickSetFormsByExercise = {};
      this.finishUnsavedSuggestedSets = [];
      this.errorMessage = getErrorMessage(error, 'Unable to load workout.');
      console.error('Live workout load failed:', error);
    } finally {
      if (!this.isStaleLoad(loadId)) {
        this.isLoading = false;
        this.clearLoadingSafetyTimeout();
        this.changeDetectorRef.detectChanges();
      }
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
      this.saveErrors = {
        ...this.saveErrors,
        [workoutExercise.id]: reps,
      };
      return;
    }

    if (typeof weightKg === 'string') {
      this.errorMessage = weightKg;
      this.saveErrors = {
        ...this.saveErrors,
        [workoutExercise.id]: weightKg,
      };
      return;
    }

    const notes = this.setForm.notes.trim();

    if (reps === null && weightKg === null && !notes) {
      this.errorMessage = 'Add reps, weight, or notes before saving a set.';
      this.saveErrors = {
        ...this.saveErrors,
        [workoutExercise.id]: this.errorMessage,
      };
      return;
    }

    this.savingSetExerciseId = workoutExercise.id;
    this.errorMessage = '';
    this.saveErrors = removeRecordKey(this.saveErrors, workoutExercise.id);

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
      this.markSetRecentlySaved(result.data.id);
      this.closeSetForm();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to save set.');
      this.saveErrors = {
        ...this.saveErrors,
        [workoutExercise.id]: this.errorMessage,
      };
      console.error('Live workout add set failed:', error);
    } finally {
      this.savingSetExerciseId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  async submitQuickSet(
    workoutExercise: WorkoutExercise,
    quickSet: QuickSetForm,
  ): Promise<void> {
    if (this.savingSetExerciseId || this.session?.status !== 'active') {
      return;
    }

    const saved = await this.saveQuickSet(workoutExercise, quickSet);

    if (saved) {
      this.errorMessage = '';
    }
  }

  async finishWorkout(): Promise<void> {
    if (!this.session || this.isFinishing) {
      return;
    }

    const unsavedSuggestedSets = this.getUnsavedSuggestedSets();

    if (unsavedSuggestedSets.length > 0) {
      this.finishUnsavedSuggestedSets = unsavedSuggestedSets;
      this.showUnsavedPrefillWarning = true;
      this.showFinishConfirmation = false;
      this.errorMessage = '';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.showFinishConfirmation = true;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();
  }

  async saveAllSuggestedSetsAndFinish(): Promise<void> {
    if (!this.session || this.isSavingSuggestedSets || this.isFinishing) {
      return;
    }

    this.isSavingSuggestedSets = true;
    this.errorMessage = '';

    try {
      const unsavedSuggestedSets = this.getUnsavedSuggestedSets();

      for (const { workoutExercise, quickSet } of unsavedSuggestedSets) {
        const saved = await this.saveQuickSet(workoutExercise, quickSet);

        if (!saved) {
          return;
        }
      }

      this.showUnsavedPrefillWarning = false;
      await this.finishWorkoutNow();
    } finally {
      this.isSavingSuggestedSets = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  closeUnsavedPrefillWarning(): void {
    this.showUnsavedPrefillWarning = false;
  }

  async confirmFinishWorkout(): Promise<void> {
    this.showFinishConfirmation = false;
    await this.finishWorkoutNow();
  }

  closeFinishConfirmation(): void {
    this.showFinishConfirmation = false;
  }

  private async finishWorkoutNow(): Promise<void> {
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

  getSaveError(key: string): string {
    return this.saveErrors[key] ?? '';
  }

  wasRecentlySaved(setId: string): boolean {
    return this.recentlySavedSetIds.includes(setId);
  }

  hasCoreWorkoutData(): boolean {
    return this.session !== null;
  }

  getQuickSetForms(workoutExerciseId: string): QuickSetForm[] {
    return this.quickSetFormsByExercise[workoutExerciseId] ?? [];
  }

  getExerciseName(exerciseId: string): string {
    return this.exerciseNames[exerciseId] ?? 'Exercise';
  }

  getPreFillSourceLabel(source: LiveWorkoutPreFillSet['source']): string {
    if (source === 'LAST_WORKOUT') {
      return 'last workout';
    }

    if (source === 'TEMPLATE') {
      return 'template targets';
    }

    return 'empty defaults';
  }

  getUnsavedSuggestedSets(): Array<{ workoutExercise: WorkoutExercise; quickSet: QuickSetForm }> {
    return this.workoutExercises.flatMap((workoutExercise) =>
      this.getQuickSetForms(workoutExercise.id)
        .filter(isSavableQuickSet)
        .map((quickSet) => ({ workoutExercise, quickSet })),
    );
  }

  getTotalSavedSets(): number {
    return Object.values(this.setsByExercise).reduce(
      (total, sets) => total + sets.length,
      0,
    );
  }

  getTotalSavedReps(): number {
    return Object.values(this.setsByExercise).reduce(
      (total, sets) => total + sets.reduce(
        (setTotal, set) => setTotal + (set.reps ?? 0),
        0,
      ),
      0,
    );
  }

  formatQuickSetWeight(quickSet: QuickSetForm): string {
    return quickSet.weightKg === null || quickSet.weightKg === ''
      ? '-'
      : `${quickSet.weightKg} kg`;
  }

  formatQuickSetReps(quickSet: QuickSetForm): string {
    return quickSet.reps === null || quickSet.reps === ''
      ? '-'
      : `${quickSet.reps}`;
  }

  formatQuickSetSummary(quickSet: QuickSetForm): string {
    const pieces = [
      quickSet.weightKg === null || quickSet.weightKg === '' ? null : `${quickSet.weightKg} kg`,
      quickSet.reps === null || quickSet.reps === '' ? null : `${quickSet.reps} reps`,
    ].filter(Boolean);

    return pieces.length > 0 ? pieces.join(' x ') : 'Ready to edit';
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

  private async saveQuickSet(
    workoutExercise: WorkoutExercise,
    quickSet: QuickSetForm,
  ): Promise<boolean> {
    const reps = parseNullableNumber(quickSet.reps, 'Reps');
    const weightKg = parseNullableNumber(quickSet.weightKg, 'Weight');

    if (typeof reps === 'string') {
      this.errorMessage = reps;
      this.saveErrors = {
        ...this.saveErrors,
        [quickSet.key]: reps,
      };
      return false;
    }

    if (typeof weightKg === 'string') {
      this.errorMessage = weightKg;
      this.saveErrors = {
        ...this.saveErrors,
        [quickSet.key]: weightKg,
      };
      return false;
    }

    const notes = quickSet.notes.trim();

    if (reps === null && weightKg === null && !notes) {
      this.errorMessage = 'Add reps, weight, or notes before saving a set.';
      this.saveErrors = {
        ...this.saveErrors,
        [quickSet.key]: this.errorMessage,
      };
      return false;
    }

    this.savingSetExerciseId = quickSet.key;
    this.errorMessage = '';
    this.saveErrors = removeRecordKey(this.saveErrors, quickSet.key);

    try {
      const result = await this.liveWorkoutService.addSet(workoutExercise.id, {
        reps,
        weightKg,
        notes: notes || null,
      });

      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Unable to save set.');
      }

      this.setsByExercise = {
        ...this.setsByExercise,
        [workoutExercise.id]: [...this.getSets(workoutExercise.id), result.data].sort(
          (a, b) => a.setNumber - b.setNumber,
        ),
      };
      this.quickSetFormsByExercise = {
        ...this.quickSetFormsByExercise,
        [workoutExercise.id]: this.getQuickSetForms(workoutExercise.id).filter(
          (currentQuickSet) => currentQuickSet.key !== quickSet.key,
        ),
      };
      this.finishUnsavedSuggestedSets = this.finishUnsavedSuggestedSets.filter(
        (item) => item.quickSet.key !== quickSet.key,
      );
      this.markSetRecentlySaved(result.data.id);

      return true;
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to save set.');
      this.saveErrors = {
        ...this.saveErrors,
        [quickSet.key]: this.errorMessage,
      };
      console.error('Live workout quick set save failed:', {
        workoutExerciseId: workoutExercise.id,
        quickSet,
        error,
      });
      return false;
    } finally {
      this.savingSetExerciseId = null;
      this.changeDetectorRef.detectChanges();
    }
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

  private markSetRecentlySaved(setId: string): void {
    this.recentlySavedSetIds = [...this.recentlySavedSetIds, setId];

    setTimeout(() => {
      this.recentlySavedSetIds = this.recentlySavedSetIds.filter(
        (currentSetId) => currentSetId !== setId,
      );
      this.changeDetectorRef.detectChanges();
    }, 1800);
  }

  private async loadPreFillForms(
    workoutExercises: WorkoutExercise[],
    setsByExercise: Record<string, WorkoutSet[]>,
  ): Promise<void> {
    const modeResult = await this.liveWorkoutService.getPreFillMode();

    if (modeResult.error) {
      console.error('Live workout pre-fill mode load error:', modeResult.error);
    }

    const nextQuickSetForms: Record<string, QuickSetForm[]> = {};

    for (const workoutExercise of workoutExercises) {
      if ((setsByExercise[workoutExercise.id] ?? []).length > 0) {
        nextQuickSetForms[workoutExercise.id] = [];
        continue;
      }

      const preFillResult = await this.liveWorkoutService.getPreFillSetsForWorkoutExercise(
        workoutExercise,
        modeResult.data,
      );

      if (preFillResult.error) {
        console.error('Live workout pre-fill load error:', {
          workoutExerciseId: workoutExercise.id,
          exerciseId: workoutExercise.exerciseId,
          error: preFillResult.error,
        });
      }

      nextQuickSetForms[workoutExercise.id] = createQuickSetForms(
        workoutExercise.id,
        preFillResult.data,
      );
    }

    this.quickSetFormsByExercise = nextQuickSetForms;
  }

  private async loadSecondaryWorkoutData(
    loadId: number,
    workoutExercises: WorkoutExercise[],
    setsByExercise: Record<string, WorkoutSet[]>,
  ): Promise<void> {
    this.isPrefillLoading = true;

    try {
      await this.loadExerciseNames();

      if (this.isStaleLoad(loadId)) {
        return;
      }

      await this.loadPreFillForms(workoutExercises, setsByExercise);

      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Live workout secondary data load failed:', {
        sessionId: this.sessionId,
        error,
      });
    } finally {
      if (!this.isStaleLoad(loadId)) {
        this.isPrefillLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  private isStaleLoad(loadId: number): boolean {
    return this.loadRunId !== loadId;
  }

  private clearLoadingSafetyTimeout(): void {
    if (!this.loadingSafetyTimeout) {
      return;
    }

    clearTimeout(this.loadingSafetyTimeout);
    this.loadingSafetyTimeout = null;
  }
}

function createEmptySetForm(): SetForm {
  return {
    reps: '',
    weightKg: '',
    notes: '',
  };
}

function createQuickSetForms(
  workoutExerciseId: string,
  preFillSets: LiveWorkoutPreFillSet[],
): QuickSetForm[] {
  const sourceSets = preFillSets.length > 0
    ? preFillSets
    : [{
        setNumber: 1,
        reps: null,
        weightKg: null,
        notes: null,
        source: 'EMPTY' as const,
      }];

  return sourceSets.map((set, index) => ({
    key: `${workoutExerciseId}-${set.source}-${index + 1}`,
    setNumber: set.setNumber,
    reps: set.reps,
    weightKg: set.weightKg,
    notes: set.notes ?? '',
    source: set.source,
  }));
}

function isSavableQuickSet(quickSet: QuickSetForm): boolean {
  return (
    (quickSet.reps !== null && quickSet.reps !== '')
    || (quickSet.weightKg !== null && quickSet.weightKg !== '')
    || quickSet.notes.trim().length > 0
  );
}

function removeRecordKey(
  record: Record<string, string>,
  key: string,
): Record<string, string> {
  const nextRecord = { ...record };
  delete nextRecord[key];

  return nextRecord;
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
