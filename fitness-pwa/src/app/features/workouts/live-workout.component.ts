import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExerciseService } from '../../core/services/exercise.service';
import { TranslationService } from '../../core/services/translation.service';
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
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('liveWorkout') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ t('workoutSession') }}</h2>
          @if (session) {
            <p class="mt-2 text-sm leading-5 text-slate-600">
              {{ t('started') }} {{ formatDate(session.startedAt) }}
            </p>
          }
        </div>

        <a
          routerLink="/templates"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('templates') }}
        </a>
      </header>

      @if (statusMessage) {
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {{ statusMessage }}
        </p>
      }

      @if (errorMessage) {
        <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2">
          <p class="text-sm font-semibold text-red-800">{{ t('error') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
        </div>
      }

      @if (showUnsavedPrefillWarning) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="app-card max-h-[85vh] w-full overflow-y-auto p-4 sm:max-w-lg">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('finishWorkout') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('unsavedSuggestedSets') }}</h3>
              <p class="mt-2 text-sm leading-5 text-slate-600">
                {{ t('saveFinishDescription') }}
              </p>
            </div>

            <div class="mt-4 space-y-2">
              @for (item of finishUnsavedSuggestedSets; track item.quickSet.key) {
                <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="font-bold leading-5 text-slate-950">
                        {{ getExerciseName(item.workoutExercise.exerciseId) }}
                      </p>
                      <p class="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {{ t('sets') }} {{ item.quickSet.setNumber }}
                      </p>
                    </div>
                    <span class="app-badge shrink-0">
                      {{ getPreFillSourceLabel(item.quickSet.source) }}
                    </span>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-2 text-sm">
                    <span class="app-badge">{{ t('weight') }} {{ formatQuickSetWeight(item.quickSet) }}</span>
                    <span class="app-badge">{{ t('reps') }} {{ formatQuickSetReps(item.quickSet) }}</span>
                  </div>

                  @if (item.quickSet.notes.trim()) {
                    <p class="mt-3 border-t border-slate-200 pt-2 text-sm leading-5 text-slate-600">
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
                class="app-button app-button-primary"
              >
                {{ isSavingSuggestedSets ? t('saving') : t('saveAllAndFinish') }}
              </button>
              <button
                type="button"
                (click)="closeUnsavedPrefillWarning()"
                class="app-button app-button-secondary"
              >
                {{ t('continueEditing') }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (showFinishConfirmation) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="app-card w-full p-4 sm:max-w-lg">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('liveWorkout') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('finishWorkout') }}</h3>
              <p class="mt-2 text-sm leading-5 text-slate-600">
                {{ t('finishReviewDescription') }}
              </p>
            </div>

            @if (getTotalSavedSets() === 0) {
              <p class="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
                {{ t('noSavedSetsWarning') }}
              </p>
            }

            <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
                <p class="mt-1 text-lg font-bold text-slate-950">{{ workoutExercises.length }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
                <p class="mt-1 text-lg font-bold text-slate-950">{{ getTotalSavedSets() }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('reps') }}</p>
                <p class="mt-1 text-lg font-bold text-slate-950">{{ getTotalSavedReps() }}</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="confirmFinishWorkout()"
                [disabled]="isFinishing"
                class="app-button app-button-primary"
              >
                {{ isFinishing ? t('finishing') : t('finishWorkout') }}
              </button>
              <button
                type="button"
                (click)="closeFinishConfirmation()"
                [disabled]="isFinishing"
                class="app-button app-button-secondary"
              >
                {{ t('continueEditing') }}
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
          <p class="font-semibold text-red-800">{{ t('unableToLoadWorkout') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage || t('workoutSessionNotFound') }}</p>
          <button
            type="button"
            (click)="loadLiveWorkout()"
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else {
        <section class="app-card space-y-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('workoutSession') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('liveWorkout') }}</h3>
            </div>
            <span
              class="app-badge"
              [class.bg-green-100]="session.status === 'active'"
              [class.text-green-800]="session.status === 'active'"
              [class.bg-slate-100]="session.status !== 'active'"
              [class.text-slate-700]="session.status !== 'active'"
            >
              {{ session.status }}
            </span>
          </div>

          <div class="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-sm">
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('started') }}</p>
              <p class="mt-1 font-bold text-slate-950">{{ formatTime(session.startedAt) }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
              <p class="mt-1 font-bold text-slate-950">{{ workoutExercises.length }}</p>
            </div>
            <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
              <p class="mt-1 font-bold text-slate-950">{{ getTotalSavedSets() }}</p>
            </div>
          </div>
        </section>

        @if (workoutExercises.length === 0) {
          <div class="app-card bg-slate-50 p-5 text-center shadow-none">
            <p class="font-semibold text-slate-800">{{ t('noExercisesFound') }}</p>
            <p class="mt-1 text-sm text-slate-600">
              {{ t('noTemplateExercises') }}
            </p>
          </div>
        } @else {
          <div class="space-y-5">
            @for (workoutExercise of workoutExercises; track workoutExercise.id; let exerciseIndex = $index) {
              <article class="app-card space-y-4">
                <div class="space-y-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                        {{ t('exerciseNumber') }} {{ exerciseIndex + 1 }}
                      </p>
                      <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">
                      {{ getExerciseName(workoutExercise.exerciseId) }}
                      </h3>
                      @if (workoutExercise.notes) {
                        <p class="mt-1 text-sm leading-5 text-slate-600">{{ workoutExercise.notes }}</p>
                      }
                    </div>
                    <button
                      type="button"
                      (click)="openSetForm(workoutExercise.id)"
                      [disabled]="session.status !== 'active' || savingSetExerciseId === workoutExercise.id"
                      class="app-button app-button-secondary min-h-11 w-auto border-green-600 px-3 py-2 text-green-700 disabled:border-slate-300 disabled:text-slate-400"
                    >
                      {{ t('addSet') }}
                    </button>
                  </div>

                  <div class="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3">
                    <span class="app-badge">{{ getSets(workoutExercise.id).length }} {{ t('sets') }}</span>
                    @if (getQuickSetForms(workoutExercise.id).length > 0) {
                      <span class="app-badge bg-green-100 text-green-800">
                        {{ getPreFillSourceLabel(getQuickSetForms(workoutExercise.id)[0].source) }}
                      </span>
                    }
                    <a
                      [routerLink]="['/exercises', workoutExercise.exerciseId, 'history']"
                      class="app-badge"
                    >
                      {{ t('history') }}
                    </a>
                  </div>
                </div>

                @if (getSets(workoutExercise.id).length > 0) {
                  <div class="space-y-2">
                    @for (set of getSets(workoutExercise.id); track set.id) {
                      <div
                        class="rounded-md border px-3 py-2.5 transition"
                        [class.border-green-200]="wasRecentlySaved(set.id)"
                        [class.bg-green-50]="wasRecentlySaved(set.id)"
                        [class.border-slate-200]="!wasRecentlySaved(set.id)"
                        [class.bg-white]="!wasRecentlySaved(set.id)"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <div class="flex min-w-0 items-center gap-2">
                            <span class="h-2 w-2 shrink-0 rounded-full bg-green-700"></span>
                            <div class="min-w-0">
                              <p class="text-xs font-bold uppercase tracking-[0.14em] text-green-700">
                              {{ wasRecentlySaved(set.id) ? t('savedJustNow') : t('saved') }}
                              </p>
                              <p class="mt-0.5 font-semibold text-slate-950">{{ t('sets') }} {{ set.setNumber }}</p>
                            </div>
                          </div>
                          <p class="shrink-0 text-sm font-bold text-slate-950">
                            {{ formatSetSummary(set) }}
                          </p>
                        </div>
                        @if (set.notes) {
                          <p class="mt-2 border-t border-slate-200 pt-2 text-sm leading-5 text-slate-600">{{ set.notes }}</p>
                        }
                      </div>
                    }
                  </div>
                }

                @if (getQuickSetForms(workoutExercise.id).length > 0) {
                  <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-bold text-slate-950">
                          {{ t('editableSuggestionsFrom') }}
                        </p>
                        <p class="mt-1 text-xs leading-5 text-slate-600">
                        {{ t('editOrSaveSuggestedSet') }}
                        </p>
                      </div>
                      <span class="app-badge shrink-0">
                        {{ getPreFillSourceLabel(getQuickSetForms(workoutExercise.id)[0].source) }}
                      </span>
                    </div>

                    @for (quickSet of getQuickSetForms(workoutExercise.id); track quickSet.key) {
                      <form
                        class="space-y-3 rounded-md border border-slate-200 bg-white p-3 transition"
                        (ngSubmit)="submitQuickSet(workoutExercise, quickSet)"
                      >
                        <div class="flex items-center justify-between gap-3">
                          <div>
                            <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{{ t('editable') }}</p>
                            <p class="mt-0.5 font-semibold text-slate-950">{{ t('sets') }} {{ quickSet.setNumber }}</p>
                          </div>
                          <p class="text-sm font-bold text-slate-600">
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
                            <span class="text-sm font-medium text-slate-700">{{ t('weight') }}</span>
                            <input
                              [id]="'quickWeight' + quickSet.key"
                              type="number"
                              min="0"
                              step="0.5"
                              [name]="'quickWeight' + quickSet.key"
                              [(ngModel)]="quickSet.weightKg"
                              class="app-input mt-2 py-2"
                            />
                          </label>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">{{ t('reps') }}</span>
                            <input
                              [id]="'quickReps' + quickSet.key"
                              type="number"
                              min="0"
                              [name]="'quickReps' + quickSet.key"
                              [(ngModel)]="quickSet.reps"
                              class="app-input mt-2 py-2"
                            />
                          </label>
                        </div>

                        <label class="block">
                          <span class="text-sm font-medium text-slate-700">{{ t('notes') }}</span>
                          <textarea
                            [id]="'quickNotes' + quickSet.key"
                            [name]="'quickNotes' + quickSet.key"
                            [(ngModel)]="quickSet.notes"
                            rows="2"
                            class="app-input mt-2"
                          ></textarea>
                        </label>

                        <button
                          type="submit"
                          [disabled]="savingSetExerciseId === quickSet.key || isSavingSuggestedSets"
                          class="app-button app-button-primary min-h-11"
                        >
                          {{ savingSetExerciseId === quickSet.key ? t('saving') : t('save') }}
                        </button>
                      </form>
                    }
                  </div>
                } @else if (getSets(workoutExercise.id).length === 0) {
                  <div class="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
                    {{ t('noSetsLogged') }}
                  </div>
                }

                @if (activeSetFormExerciseId === workoutExercise.id) {
                  <form
                    class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    (ngSubmit)="submitSet(workoutExercise)"
                  >
                    @if (getSaveError(workoutExercise.id)) {
                      <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {{ getSaveError(workoutExercise.id) }}
                      </p>
                    }

                    <div class="grid grid-cols-2 gap-3">
                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">{{ t('weight') }}</span>
                        <input
                          [id]="'weightKg' + workoutExercise.id"
                          type="number"
                          min="0"
                          step="0.5"
                          [name]="'weightKg' + workoutExercise.id"
                          [(ngModel)]="setForm.weightKg"
                          class="app-input mt-2 py-2"
                        />
                      </label>

                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">{{ t('reps') }}</span>
                        <input
                          [id]="'reps' + workoutExercise.id"
                          type="number"
                          min="0"
                          [name]="'reps' + workoutExercise.id"
                          [(ngModel)]="setForm.reps"
                          class="app-input mt-2 py-2"
                        />
                      </label>
                    </div>

                    <label class="block">
                      <span class="text-sm font-medium text-slate-700">{{ t('notes') }}</span>
                      <textarea
                        [id]="'setNotes' + workoutExercise.id"
                        [name]="'setNotes' + workoutExercise.id"
                        [(ngModel)]="setForm.notes"
                        rows="2"
                        class="app-input mt-2"
                      ></textarea>
                    </label>

                    <div class="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        (click)="closeSetForm()"
                        class="app-button app-button-secondary"
                      >
                        {{ t('cancel') }}
                      </button>
                      <button
                        type="submit"
                        [disabled]="savingSetExerciseId === workoutExercise.id"
                        class="app-button app-button-primary"
                      >
                        {{ savingSetExerciseId === workoutExercise.id ? t('saving') : t('save') }}
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
            (click)="openCancelWorkoutModal()"
            [disabled]="isCancelling || isFinishing || session.status !== 'active'"
            class="app-button app-button-danger"
          >
            {{ isCancelling ? t('cancelling') : t('cancelWorkout') }}
          </button>
          <button
            type="button"
            (click)="finishWorkout()"
            [disabled]="isFinishing || isCancelling || session.status !== 'active'"
            class="app-button app-button-primary"
          >
            {{ isFinishing ? t('finishing') : t('finishWorkout') }}
          </button>
        </div>
      }

      @if (showCancelWorkoutModal && session) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="app-card w-full p-4 sm:max-w-lg">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-red-700">{{ t('cancelWorkout') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('cancelWorkoutModalTitle') }}</h3>
              <p class="mt-2 text-sm leading-5 text-slate-600">
                {{ t('cancelWorkoutDescription') }}
              </p>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 text-sm">
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
                <p class="mt-1 font-bold text-slate-950">{{ workoutExercises.length }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
                <p class="mt-1 font-bold text-slate-950">{{ getTotalSavedSets() }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('started') }}</p>
                <p class="mt-1 font-bold text-slate-950">{{ formatTime(session.startedAt) }}</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="confirmCancelWorkout()"
                [disabled]="isCancelling"
                class="app-button app-button-danger"
              >
                {{ isCancelling ? t('cancelling') : t('cancelWorkout') }}
              </button>
              <button
                type="button"
                (click)="closeCancelWorkoutModal()"
                [disabled]="isCancelling"
                class="app-button app-button-secondary"
              >
                {{ t('continueEditing') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class LiveWorkoutComponent {
  private readonly translationService = inject(TranslationService);
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
  showCancelWorkoutModal = false;
  errorMessage = '';
  statusMessage = '';

  private readonly sessionId = this.route.snapshot.paramMap.get('sessionId');
  private loadRunId = 0;
  private loadingSafetyTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    void this.loadLiveWorkout();
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
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

      const nextSetsByExercise = await this.loadSetsByExercise(exercisesResult.data);

      if (this.isStaleLoad(loadId)) {
        return;
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
      this.errorMessage = this.t('addSetValidation');
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

  openCancelWorkoutModal(): void {
    if (!this.session || this.isCancelling) {
      return;
    }

    this.showCancelWorkoutModal = true;
  }

  closeCancelWorkoutModal(): void {
    if (this.isCancelling) {
      return;
    }

    this.showCancelWorkoutModal = false;
  }

  async confirmCancelWorkout(): Promise<void> {
    if (!this.session || this.isCancelling) {
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
      this.showCancelWorkoutModal = false;
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
    return this.exerciseNames[exerciseId] ?? this.t('exercise');
  }

  getPreFillSourceLabel(source: LiveWorkoutPreFillSet['source']): string {
    if (source === 'LAST_WORKOUT') {
      return this.t('lastWorkout');
    }

    if (source === 'TEMPLATE') {
      return this.t('templateTargets');
    }

    return this.t('emptyDefaults');
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

    return pieces.length > 0 ? pieces.join(' / ') : this.t('saved');
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }

  formatTime(value: string): string {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
      this.errorMessage = this.t('addSetValidation');
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

  private async loadExerciseNames(): Promise<Record<string, string>> {
    try {
      const result = await this.exerciseService.getExercises();

      if (result.error) {
        console.error('Live workout exercise metadata load error:', result.error);
      }

      return result.data.reduce<Record<string, string>>(
        (names, exercise: Exercise) => ({
          ...names,
          [exercise.id]: exercise.name,
        }),
        {},
      );
    } catch (error) {
      console.error('Live workout exercise metadata load failed:', error);
      return {};
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
  ): Promise<Record<string, QuickSetForm[]>> {
    const modeResult = await this.liveWorkoutService.getPreFillMode();

    if (modeResult.error) {
      console.error('Live workout pre-fill mode load error:', modeResult.error);
    }

    const entries = await Promise.all(workoutExercises.map(async (workoutExercise) => {
      if ((setsByExercise[workoutExercise.id] ?? []).length > 0) {
        return [workoutExercise.id, []] as const;
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

      return [workoutExercise.id, createQuickSetForms(
        workoutExercise.id,
        preFillResult.data,
      )] as const;
    }));

    return Object.fromEntries(entries);
  }

  private async loadSecondaryWorkoutData(
    loadId: number,
    workoutExercises: WorkoutExercise[],
    setsByExercise: Record<string, WorkoutSet[]>,
  ): Promise<void> {
    this.isPrefillLoading = true;

    try {
      const [exerciseNames, quickSetFormsByExercise] = await Promise.all([
        this.loadExerciseNames(),
        this.loadPreFillForms(workoutExercises, setsByExercise),
      ]);

      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.exerciseNames = exerciseNames;
      this.quickSetFormsByExercise = quickSetFormsByExercise;
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

  private async loadSetsByExercise(
    workoutExercises: WorkoutExercise[],
  ): Promise<Record<string, WorkoutSet[]>> {
    const entries = await Promise.all(workoutExercises.map(async (workoutExercise) => {
      const setsResult = await this.liveWorkoutService.getWorkoutSets(workoutExercise.id);

      if (setsResult.error) {
        console.error('Live workout sets load error:', {
          workoutExerciseId: workoutExercise.id,
          error: setsResult.error,
        });
        throw new Error(setsResult.error);
      }

      return [workoutExercise.id, setsResult.data] as const;
    }));

    return Object.fromEntries(entries);
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
