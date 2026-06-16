import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ExerciseService } from '../../../core/services/exercise.service';
import { LiveWorkoutService } from '../../../core/services/live-workout.service';
import { TranslationService } from '../../../core/services/translation.service';
import { WorkoutTemplateService } from '../../../core/services/workout-template.service';
import {
  Exercise,
  ExerciseCategory,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTemplateBlock,
  WorkoutTemplateBlockExercise,
  WorkoutTemplateBlockType,
  WorkoutTemplateSetType,
} from '../../../shared/models/fitness.models';

interface BlockTypeOption {
  value: WorkoutTemplateBlockType;
  label: string;
}

interface CustomExerciseForm {
  name: string;
  categoryId: string | null;
  trainingType: string;
  exerciseType: string;
  equipment: string;
  description: string;
}

@Component({
  selector: 'app-template-editor',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('workouts') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ template?.name || t('template') }}</h2>
          @if (template?.description) {
            <p class="mt-2 text-sm leading-5 text-slate-600">{{ template?.description }}</p>
          }
        </div>

        <div class="flex shrink-0 flex-col gap-2">
          @if (template) {
            <button
              type="button"
              (click)="startWorkout()"
              [disabled]="isStartingWorkout || isSaving"
              class="app-button app-button-primary min-h-11 w-auto px-3 py-2"
            >
              {{ isStartingWorkout ? t('loading') : t('startWorkout') }}
            </button>
          }
          <a
            routerLink="/templates"
            class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
          >
            {{ t('back') }}
          </a>
        </div>
      </header>

      @if (template && !canEdit) {
        <p class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {{ t('readyWorkoutReadOnlyDescription') }}
        </p>
      }

      @if (statusMessage) {
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {{ statusMessage }}
        </p>
      }

      @if (errorMessage) {
        <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>
      }

      @if (isSaving && actionMessage) {
        <p class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {{ actionMessage }}
        </p>
      }

      @if (showActiveWorkoutPrompt && activeWorkout) {
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 class="text-lg font-bold text-amber-950">{{ t('activeWorkout') }}</h3>
          <p class="mt-2 text-sm text-amber-800">
            {{ t('activeWorkoutStartPrompt') }}
          </p>
          <div class="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              (click)="resumeActiveWorkout()"
              class="app-button app-button-primary"
            >
              {{ t('resume') }}
            </button>
            <button
              type="button"
              (click)="cancelCurrentAndStartNew()"
              [disabled]="isStartingWorkout"
              class="app-button app-button-danger"
            >
              {{ t('cancelWorkout') }}
            </button>
            <button
              type="button"
              (click)="closeActiveWorkoutPrompt()"
              class="app-button app-button-secondary"
            >
              {{ t('cancel') }}
            </button>
          </div>
        </div>
      }

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (!template) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('unableToLoadTemplate') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage || t('templateNotFound') }}</p>
          <button
            type="button"
            (click)="reloadTemplate()"
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else {
        @if (canEdit) {
          <form
            class="app-card space-y-4 bg-slate-50 shadow-none"
            (ngSubmit)="addBlock()"
          >
            <div>
              <h3 class="app-section-title">{{ t('addBlock') }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('builderBlockDescription') }}</p>
            </div>
            <label class="block">
              <span class="text-sm font-semibold text-slate-700">{{ t('blockTitle') }}</span>
              <input
                type="text"
                name="newBlockTitle"
                [(ngModel)]="newBlockTitle"
                [placeholder]="t('blockTitlePlaceholder')"
                class="app-input mt-2"
              />
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-700">{{ t('blockType') }}</span>
              <select
                name="newBlockType"
                [(ngModel)]="newBlockType"
                class="app-input mt-2"
              >
                @for (type of blockTypes; track type.value) {
                  <option [ngValue]="type.value">{{ type.label }}</option>
                }
              </select>
            </label>

            <button
              type="submit"
              [disabled]="isSaving"
              class="app-button app-button-primary"
            >
              {{ isSaving ? t('loading') : t('addBlock') }}
            </button>
          </form>
        }

        @if (blocks.length === 0) {
          <div class="app-card bg-slate-50 p-5 text-center shadow-none">
            <p class="font-semibold text-slate-800">{{ t('noTemplatesYet') }}</p>
            <p class="mt-1 text-sm text-slate-600">{{ t('addBlock') }}</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (block of blocks; track block.id; let blockIndex = $index) {
              <article class="app-card space-y-4">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                        {{ getBlockTypeLabel(block.blockType) }}
                      </p>
                      @if (canEdit) {
                        <input
                          type="text"
                          [name]="'blockTitle' + block.id"
                          [(ngModel)]="block.title"
                          (blur)="renameBlock(block)"
                          class="app-input mt-1 py-2 text-lg font-bold text-slate-950"
                        />
                      } @else {
                        <h3 class="mt-1 text-lg font-bold leading-6 text-slate-950">
                          {{ block.title || t('untitledBlock') }}
                        </h3>
                      }
                    </div>

                    @if (canEdit) {
                      <button
                        type="button"
                        (click)="openRemoveBlockModal(block)"
                        [disabled]="isSaving"
                        class="app-button app-button-danger min-h-11 w-auto px-3 py-2"
                        [class.cursor-not-allowed]="isSaving"
                        [class.opacity-60]="isSaving"
                      >
                        {{ t('delete') }}
                      </button>
                    }
                  </div>

                  @if (canEdit) {
                    <div class="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                      <select
                        [name]="'blockType' + block.id"
                        [(ngModel)]="block.blockType"
                        (ngModelChange)="updateBlockType(block)"
                        class="app-input col-span-3 py-2 text-sm"
                      >
                        @for (type of blockTypes; track type.value) {
                          <option [ngValue]="type.value">{{ type.label }}</option>
                        }
                      </select>
                      <button
                        type="button"
                        (click)="moveBlock(blockIndex, -1)"
                        [disabled]="blockIndex === 0 || isSaving"
                        class="app-button app-button-secondary min-h-11 px-3 py-2"
                      >
                        {{ t('up') }}
                      </button>
                      <button
                        type="button"
                        (click)="moveBlock(blockIndex, 1)"
                        [disabled]="blockIndex === blocks.length - 1 || isSaving"
                        class="app-button app-button-secondary min-h-11 px-3 py-2"
                      >
                        {{ t('down') }}
                      </button>
                      <button
                        type="button"
                        (click)="openExerciseSearch(block.id)"
                        class="app-button app-button-secondary min-h-11 border-green-600 px-3 py-2 text-green-700"
                      >
                        {{ t('addExercise') }}
                      </button>
                    </div>
                  }

                  @if (activeExerciseSearchBlockId === block.id) {
                    <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label class="block">
                        <span class="text-sm font-bold text-slate-800">{{ t('addExercise') }}</span>
                        <input
                          type="search"
                          name="exerciseSearch"
                          [(ngModel)]="exerciseSearchQuery"
                          (ngModelChange)="searchExercises($event)"
                          [placeholder]="t('searchByExerciseName')"
                          class="app-input mt-2"
                        />
                      </label>

                      @if (isSearchingExercises) {
                        <p class="text-sm text-slate-600">{{ t('loading') }}</p>
                      } @else if (exerciseSearchResults.length === 0) {
                        @if (hasSearchedExercises && exerciseSearchQuery.trim()) {
                          <div class="space-y-3 rounded-md border border-dashed border-slate-300 bg-white p-4">
                            <div>
                              <p class="font-semibold text-slate-900">{{ t('noExercisesFound') }}</p>
                              <p class="mt-1 text-sm leading-5 text-slate-600">
                                {{ t('createPrivateExerciseAdd') }}
                              </p>
                            </div>
                            <button
                              type="button"
                              (click)="openCustomExerciseForm(block.id)"
                              class="app-button app-button-secondary min-h-11 w-auto border-green-600 px-3 py-2 text-green-700"
                            >
                              + {{ t('createCustomExercise') }}
                            </button>
                          </div>
                        } @else {
                          <p class="text-sm text-slate-600">{{ t('searchExerciseToAdd') }}</p>
                        }
                      } @else {
                        <div class="space-y-2">
                          @for (exercise of exerciseSearchResults; track exercise.id) {
                            <button
                              type="button"
                              (click)="addExercise(block, exercise)"
                              [disabled]="isAddingExercise(exercise.id) || isExerciseAlreadyInBlock(block.id, exercise.id)"
                              class="app-button app-button-secondary min-h-0 justify-between gap-3 p-3 text-left"
                              [class.cursor-not-allowed]="isAddingExercise(exercise.id) || isExerciseAlreadyInBlock(block.id, exercise.id)"
                              [class.opacity-60]="isAddingExercise(exercise.id) || isExerciseAlreadyInBlock(block.id, exercise.id)"
                            >
                              <span>
                                <span class="block font-semibold text-slate-950">{{ exercise.name }}</span>
                                <span class="mt-1 block text-sm text-slate-600">
                                  {{ exercise.equipment || t('noEquipment') }}
                                </span>
                              </span>
                              <span class="text-sm font-semibold text-green-700">
                                @if (isExerciseAlreadyInBlock(block.id, exercise.id)) {
                                  {{ t('selected') }}
                                } @else if (isAddingExercise(exercise.id)) {
                                  {{ t('loading') }}
                                } @else {
                                  {{ t('add') }}
                                }
                              </span>
                            </button>
                          }
                        </div>
                      }

                      @if (customExerciseBlockId === block.id) {
                        <form
                          class="app-card space-y-3 shadow-none"
                          (ngSubmit)="createCustomExercise(block)"
                        >
                          <div>
                            <h4 class="font-bold text-slate-950">{{ t('createCustomExercise') }}</h4>
                            <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('privateExerciseDescription') }}</p>
                          </div>

                          <label class="block">
                            <span class="text-sm font-semibold text-slate-700">{{ t('name') }}</span>
                            <input
                              type="text"
                              name="customExerciseName"
                              [(ngModel)]="customExercise.name"
                              required
                              class="app-input mt-2"
                            />
                          </label>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">{{ t('exerciseLibrary') }}</span>
                            <select
                              name="customExerciseCategory"
                              [(ngModel)]="customExercise.categoryId"
                              class="app-input mt-2"
                            >
                              <option [ngValue]="null">{{ t('noCategory') }}</option>
                              @for (category of categories; track category.id) {
                                <option [ngValue]="category.id">{{ category.name }}</option>
                              }
                            </select>
                          </label>

                          <div class="grid gap-3 sm:grid-cols-2">
                            <label class="block">
                              <span class="text-sm font-medium text-slate-700">{{ t('trainingType') }}</span>
                              <input
                                type="text"
                                name="customExerciseTrainingType"
                                [(ngModel)]="customExercise.trainingType"
                                placeholder="gym, calisthenics"
                                class="app-input mt-2"
                              />
                            </label>

                            <label class="block">
                              <span class="text-sm font-medium text-slate-700">{{ t('exerciseType') }}</span>
                              <input
                                type="text"
                                name="customExerciseExerciseType"
                                [(ngModel)]="customExercise.exerciseType"
                                placeholder="bodyweight, gym"
                                class="app-input mt-2"
                              />
                            </label>
                          </div>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">{{ t('equipment') }}</span>
                            <input
                              type="text"
                              name="customExerciseEquipment"
                              [(ngModel)]="customExercise.equipment"
                              placeholder="Dumbbells, bodyweight, machine"
                              class="app-input mt-2"
                            />
                          </label>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">{{ t('notes') }}</span>
                            <textarea
                              name="customExerciseDescription"
                              [(ngModel)]="customExercise.description"
                              rows="3"
                              class="app-input mt-2"
                            ></textarea>
                          </label>

                          <div class="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              (click)="closeCustomExerciseForm()"
                              class="app-button app-button-secondary min-h-11"
                            >
                              {{ t('cancel') }}
                            </button>
                            <button
                              type="submit"
                              [disabled]="isCreatingCustomExercise || !customExercise.name.trim()"
                              class="app-button app-button-primary min-h-11"
                            >
                              {{ isCreatingCustomExercise ? t('loading') : t('create') }}
                            </button>
                          </div>
                        </form>
                      }
                    </div>
                  }

                  @if (getBlockExercises(block.id).length === 0) {
                    <div class="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                      {{ t('noExercisesFound') }}
                    </div>
                  } @else {
                    <div class="space-y-2 border-t border-slate-200 pt-3">
                      @for (templateExercise of getBlockExercises(block.id); track templateExercise.id; let exerciseIndex = $index) {
                        <div class="rounded-md border border-slate-200 bg-white p-3">
                          <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="font-bold leading-5 text-slate-950">
                                {{ getExerciseName(templateExercise.exerciseId) }}
                              </p>
                              <p class="mt-1 text-sm leading-5 text-slate-600">
                                {{ getSetTypeLabel(templateExercise.setType) }}
                              </p>
                            </div>

                            @if (canEdit) {
                              <button
                                type="button"
                                (click)="removeExercise(templateExercise)"
                                [disabled]="isSaving"
                                class="app-button app-button-danger min-h-11 w-auto px-3 py-2"
                                [class.cursor-not-allowed]="isSaving"
                                [class.opacity-60]="isSaving"
                              >
                                {{ t('delete') }}
                              </button>
                            }
                          </div>

                          @if (canEdit) {
                            <div class="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3">
                              <button
                                type="button"
                                (click)="moveExercise(block.id, exerciseIndex, -1)"
                                [disabled]="exerciseIndex === 0 || isSaving"
                                class="app-button app-button-secondary min-h-11 px-3 py-2"
                              >
                                {{ t('up') }}
                              </button>
                              <button
                                type="button"
                                (click)="moveExercise(block.id, exerciseIndex, 1)"
                                [disabled]="exerciseIndex === getBlockExercises(block.id).length - 1 || isSaving"
                                class="app-button app-button-secondary min-h-11 px-3 py-2"
                              >
                                {{ t('down') }}
                              </button>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      }

      @if (blockPendingRemove) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="app-card w-full p-4 sm:max-w-lg">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-red-700">{{ t('delete') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('removeBlockModalTitle') }}</h3>
              <p class="mt-2 text-sm leading-5 text-slate-600">
                {{ t('removeBlockDescription') }}
              </p>
            </div>

            <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <p class="font-bold text-slate-950">{{ blockPendingRemove.title || t('untitledBlock') }}</p>
              <p class="mt-1 text-slate-600">{{ getBlockTypeLabel(blockPendingRemove.blockType) }}</p>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="confirmRemoveBlock()"
                [disabled]="isSaving"
                class="app-button app-button-danger"
              >
                {{ isSaving ? t('loading') : t('delete') }}
              </button>
              <button
                type="button"
                (click)="closeRemoveBlockModal()"
                [disabled]="isSaving"
                class="app-button app-button-secondary"
              >
                {{ t('cancel') }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class TemplateEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];
  readonly blockTypes: BlockTypeOption[] = [
    { value: 'warmup', label: 'Warmup' },
    { value: 'normal', label: 'Normal' },
    { value: 'superset', label: 'Superset' },
    { value: 'dropset', label: 'Dropset' },
    { value: 'giant_set', label: 'Giant Set' },
    { value: 'circuit', label: 'Circuit' },
    { value: 'notes', label: 'Notes' },
  ];

  template: WorkoutTemplate | null = null;
  blocks: WorkoutTemplateBlock[] = [];
  blockExercises: Record<string, WorkoutTemplateBlockExercise[]> = {};
  categories: ExerciseCategory[] = [];
  exercises: Exercise[] = [];
  exerciseSearchResults: Exercise[] = [];
  activeExerciseSearchBlockId: string | null = null;
  customExerciseBlockId: string | null = null;
  exerciseSearchQuery = '';
  hasSearchedExercises = false;
  newBlockTitle = '';
  newBlockType: WorkoutTemplateBlockType = 'normal';
  customExercise: CustomExerciseForm = createEmptyCustomExerciseForm();
  isLoading = true;
  isSaving = false;
  isStartingWorkout = false;
  isSearchingExercises = false;
  isCreatingCustomExercise = false;
  errorMessage = '';
  statusMessage = '';
  actionMessage = '';
  currentUserId = '';
  activeWorkout: WorkoutSession | null = null;
  showActiveWorkoutPrompt = false;
  blockPendingRemove: WorkoutTemplateBlock | null = null;
  private readonly addingExerciseKeys = new Set<string>();
  private readonly templateId = this.route.snapshot.paramMap.get('id');
  private readonly isViewMode = this.route.snapshot.queryParamMap.get('mode') === 'view';
  private mainLoadId = 0;
  private metadataLoadId = 0;
  private searchRequestId = 0;
  private mainLoadingSafetyTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly mainLoadingSafetyMs = 8000;

  get canEdit(): boolean {
    return !this.isViewMode && this.template?.isBuiltin === false && this.template.ownerId === this.currentUserId;
  }

  constructor() {
    void this.loadCurrentUser();
    void this.reloadTemplate();
    void this.loadExerciseMetadata();
  }

  t(key: string): string {
    return this.translationService.translate(key);
  }

  private async loadCurrentUser(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    this.currentUserId = user?.id ?? '';
    this.changeDetectorRef.detectChanges();
  }

  async startWorkout(): Promise<void> {
    if (!this.template || this.isStartingWorkout) {
      return;
    }

    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const activeResult = await this.liveWorkoutService.resumeWorkout();

      if (activeResult.error) {
        this.errorMessage = activeResult.error;
        return;
      }

      if (activeResult.data) {
        this.activeWorkout = activeResult.data;
        this.showActiveWorkoutPrompt = true;
        return;
      }

      await this.startNewWorkout();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to start workout.');
      console.error('Template editor start workout failed:', error);
    } finally {
      this.changeDetectorRef.detectChanges();
    }
  }

  async resumeActiveWorkout(): Promise<void> {
    if (!this.activeWorkout) {
      return;
    }

    await this.router.navigate(['/workout/live', this.activeWorkout.id]);
  }

  async cancelCurrentAndStartNew(): Promise<void> {
    if (!this.activeWorkout || this.isStartingWorkout) {
      return;
    }

    this.isStartingWorkout = true;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const cancelResult = await this.liveWorkoutService.cancelWorkout(this.activeWorkout.id);

      if (cancelResult.error) {
        this.errorMessage = cancelResult.error;
        return;
      }

      this.closeActiveWorkoutPrompt();
      await this.startNewWorkout();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to start workout.');
      console.error('Template editor cancel and start failed:', error);
    } finally {
      this.isStartingWorkout = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  closeActiveWorkoutPrompt(): void {
    this.showActiveWorkoutPrompt = false;
  }

  private async startNewWorkout(): Promise<void> {
    if (!this.template) {
      return;
    }

    this.isStartingWorkout = true;

    try {
      const result = await this.liveWorkoutService.startWorkoutFromTemplate(this.template.id);

      if (result.error || !result.data) {
        this.errorMessage = result.error ?? 'Unable to start workout.';
        return;
      }

      await this.router.navigate(['/workout/live', result.data.id]);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to start workout.');
      console.error('Template editor start workout failed:', error);
    } finally {
      this.isStartingWorkout = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async addBlock(): Promise<void> {
    if (!this.template || !this.canEdit || this.isSaving) {
      return;
    }

    this.beginAction(this.t('addingBlock'));
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.createBlock({
        workoutTemplateId: this.template.id,
        title: this.newBlockTitle.trim() || this.getBlockTypeLabel(this.newBlockType),
        blockType: this.newBlockType,
        sortOrder: this.blocks.length + 1,
      });

      if (result.error || !result.data) {
        this.errorMessage = result.error ?? 'Unable to add block.';
        console.error('Template editor add block error:', this.errorMessage);
        return;
      }

      this.newBlockTitle = '';
      this.newBlockType = 'normal';
      this.statusMessage = this.t('blockAdded');
      this.blocks = [...this.blocks, result.data].sort((a, b) => a.sortOrder - b.sortOrder);
      this.blockExercises = {
        ...this.blockExercises,
        [result.data.id]: [],
      };
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to add block.');
      console.error('Template editor add block failed:', error);
    } finally {
      this.finishAction();
      this.changeDetectorRef.detectChanges();
    }
  }

  async renameBlock(block: WorkoutTemplateBlock): Promise<void> {
    await this.updateBlock(block, { title: block.title?.trim() || 'Untitled block' });
  }

  async updateBlockType(block: WorkoutTemplateBlock): Promise<void> {
    await this.updateBlock(block, { blockType: block.blockType });
  }

  openRemoveBlockModal(block: WorkoutTemplateBlock): void {
    if (!this.canEdit || this.isSaving) {
      return;
    }

    this.blockPendingRemove = block;
  }

  closeRemoveBlockModal(): void {
    if (this.isSaving) {
      return;
    }

    this.blockPendingRemove = null;
  }

  async confirmRemoveBlock(): Promise<void> {
    const block = this.blockPendingRemove;

    if (!block || !this.canEdit || this.isSaving) {
      return;
    }

    this.beginAction(this.t('removingBlock'));
    this.errorMessage = '';
    this.statusMessage = '';
    const previousBlocks = this.blocks;
    const previousBlockExercises = this.blockExercises;

    try {
      this.blocks = this.blocks
        .filter((currentBlock) => currentBlock.id !== block.id)
        .map((currentBlock, index) => ({ ...currentBlock, sortOrder: index + 1 }));
      const { [block.id]: _removed, ...remainingExercises } = this.blockExercises;
      this.blockExercises = remainingExercises;
      this.changeDetectorRef.detectChanges();

      const result = await this.workoutTemplateService.deleteBlock(block.id);

      if (result.error) {
        throw new Error(result.error);
      }

      await this.saveBlockOrder();
      this.statusMessage = this.t('blockRemoved');
      this.blockPendingRemove = null;
    } catch (error) {
      this.blocks = previousBlocks;
      this.blockExercises = previousBlockExercises;
      this.errorMessage = getErrorMessage(error, 'Unable to remove block.');
      console.error('Template editor remove block failed:', error);
    } finally {
      this.finishAction();
      this.changeDetectorRef.detectChanges();
    }
  }

  async moveBlock(index: number, direction: -1 | 1): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= this.blocks.length) {
      return;
    }

    const previousBlocks = this.blocks;
    this.beginAction(this.t('reorderingBlocks'));
    this.errorMessage = '';

    try {
      const reorderedBlocks = [...this.blocks];
      [reorderedBlocks[index], reorderedBlocks[targetIndex]] = [
        reorderedBlocks[targetIndex],
        reorderedBlocks[index],
      ];

      this.blocks = reorderedBlocks.map((block, blockIndex) => ({
        ...block,
        sortOrder: blockIndex + 1,
      }));

      await this.saveBlockOrder();
    } catch (error) {
      this.blocks = previousBlocks;
      this.errorMessage = getErrorMessage(error, 'Unable to reorder blocks.');
      console.error('Template editor block reorder failed:', error);
    } finally {
      this.finishAction();
      this.changeDetectorRef.detectChanges();
    }
  }

  openExerciseSearch(blockId: string): void {
    this.activeExerciseSearchBlockId = this.activeExerciseSearchBlockId === blockId ? null : blockId;
    this.customExerciseBlockId = null;
    this.exerciseSearchQuery = '';
    this.exerciseSearchResults = [];
    this.hasSearchedExercises = false;
  }

  async searchExercises(query: string): Promise<void> {
    const trimmedQuery = query.trim();
    const requestId = ++this.searchRequestId;

    if (!trimmedQuery) {
      this.exerciseSearchResults = [];
      this.hasSearchedExercises = false;
      this.isSearchingExercises = false;
      return;
    }

    this.isSearchingExercises = true;
    this.errorMessage = '';

    try {
      const result = await this.exerciseService.searchExercises(trimmedQuery);

      if (requestId !== this.searchRequestId) {
        return;
      }

      this.hasSearchedExercises = true;

      if (result.error) {
        this.errorMessage = result.error;
        this.exerciseSearchResults = [];
        return;
      }

      this.exerciseSearchResults = result.data.slice(0, 8);
    } catch (error) {
      if (requestId === this.searchRequestId) {
        this.errorMessage = getErrorMessage(error, 'Unable to search exercises.');
        this.exerciseSearchResults = [];
      }
    } finally {
      if (requestId === this.searchRequestId) {
        this.isSearchingExercises = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  async addExercise(block: WorkoutTemplateBlock, exercise: Exercise): Promise<void> {
    if (!this.canEdit || this.isSaving) {
      return;
    }

    const addKey = this.getAddingExerciseKey(block.id, exercise.id);
    if (this.addingExerciseKeys.has(addKey) || this.isExerciseAlreadyInBlock(block.id, exercise.id)) {
      return;
    }

    this.addingExerciseKeys.add(addKey);
    this.errorMessage = '';
    this.statusMessage = '';
    this.changeDetectorRef.detectChanges();
    let optimisticExercise: WorkoutTemplateBlockExercise | null = null;

    try {
      const existingExercises = this.getBlockExercises(block.id);
      optimisticExercise = {
        id: `pending-${block.id}-${exercise.id}-${Date.now()}`,
        workoutTemplateBlockId: block.id,
        exerciseId: exercise.id,
        exerciseVariantId: null,
        sortOrder: existingExercises.length + 1,
        setType: getDefaultSetType(block.blockType),
        targetSets: null,
        targetReps: null,
        targetWeightKg: null,
        targetDurationSeconds: null,
        targetDistanceMeters: null,
        restSeconds: null,
        tempo: null,
        rir: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.blockExercises = {
        ...this.blockExercises,
        [block.id]: [...existingExercises, optimisticExercise],
      };
      this.changeDetectorRef.detectChanges();

      const result = await this.workoutTemplateService.addExerciseToBlock({
        workoutTemplateBlockId: block.id,
        exerciseId: exercise.id,
        sortOrder: optimisticExercise.sortOrder,
        setType: optimisticExercise.setType,
      });

      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Unable to add exercise.');
      }

      this.statusMessage = 'Exercise added.';
      const optimisticExerciseId = optimisticExercise.id;
      this.blockExercises = {
        ...this.blockExercises,
        [block.id]: this.getBlockExercises(block.id).map((templateExercise) =>
          templateExercise.id === optimisticExerciseId ? result.data as WorkoutTemplateBlockExercise : templateExercise,
        ).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        ),
      };
    } catch (error) {
      if (optimisticExercise) {
        this.blockExercises = {
          ...this.blockExercises,
          [block.id]: this.getBlockExercises(block.id).filter(
            (templateExercise) => templateExercise.id !== optimisticExercise?.id,
          ),
        };
      }
      this.errorMessage = getErrorMessage(error, 'Unable to add exercise.');
    } finally {
      this.addingExerciseKeys.delete(addKey);
      this.changeDetectorRef.detectChanges();
    }
  }

  openCustomExerciseForm(blockId: string): void {
    this.customExerciseBlockId = blockId;
    this.customExercise = {
      ...createEmptyCustomExerciseForm(),
      name: this.exerciseSearchQuery.trim(),
    };
    this.errorMessage = '';
  }

  closeCustomExerciseForm(): void {
    this.customExerciseBlockId = null;
    this.customExercise = createEmptyCustomExerciseForm();
  }

  async createCustomExercise(block: WorkoutTemplateBlock): Promise<void> {
    const name = this.customExercise.name.trim();

    if (!name || this.isCreatingCustomExercise) {
      return;
    }

    this.isCreatingCustomExercise = true;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const createResult = await this.exerciseService.createCustomExercise({
        name,
        categoryId: this.customExercise.categoryId,
        trainingType: this.customExercise.trainingType.trim() || null,
        exerciseType: this.customExercise.exerciseType.trim() || null,
        equipment: this.customExercise.equipment.trim() || null,
        description: this.customExercise.description.trim() || null,
      });

      if (createResult.error || !createResult.data) {
        this.errorMessage = createResult.error ?? 'Unable to create custom exercise.';
        return;
      }

      this.exercises = [...this.exercises, createResult.data].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      this.exerciseSearchResults = [createResult.data];
      this.closeCustomExerciseForm();
      await this.addExercise(block, createResult.data);
      this.statusMessage = 'Custom exercise created and added.';
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to create custom exercise.');
    } finally {
      this.isCreatingCustomExercise = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async removeExercise(templateExercise: WorkoutTemplateBlockExercise): Promise<void> {
    if (!this.canEdit || this.isSaving) {
      return;
    }

    this.beginAction('Removing exercise...');
    this.errorMessage = '';
    this.statusMessage = '';
    const blockId = templateExercise.workoutTemplateBlockId;
    const previousExercises = this.getBlockExercises(blockId);

    try {
      this.blockExercises = {
        ...this.blockExercises,
        [blockId]: previousExercises
          .filter((exercise) => exercise.id !== templateExercise.id)
          .map((exercise, index) => ({ ...exercise, sortOrder: index + 1 })),
      };
      this.changeDetectorRef.detectChanges();

      const result = await this.workoutTemplateService.deleteTemplateExercise(templateExercise.id);

      if (result.error) {
        throw new Error(result.error);
      }

      await this.saveExerciseOrder(blockId);
      this.statusMessage = 'Exercise removed.';
    } catch (error) {
      this.blockExercises = {
        ...this.blockExercises,
        [blockId]: previousExercises,
      };
      this.errorMessage = getErrorMessage(error, 'Unable to remove exercise.');
      console.error('Template editor remove exercise failed:', error);
    } finally {
      this.finishAction();
      this.changeDetectorRef.detectChanges();
    }
  }

  async moveExercise(blockId: string, index: number, direction: -1 | 1): Promise<void> {
    if (this.isSaving) {
      return;
    }

    const exercises = [...this.getBlockExercises(blockId)];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= exercises.length) {
      return;
    }

    const previousExercises = this.getBlockExercises(blockId);
    this.beginAction(this.t('reorderingExercises'));
    this.errorMessage = '';

    try {
      [exercises[index], exercises[targetIndex]] = [exercises[targetIndex], exercises[index]];
      this.blockExercises[blockId] = exercises.map((exercise, exerciseIndex) => ({
        ...exercise,
        sortOrder: exerciseIndex + 1,
      }));

      await this.saveExerciseOrder(blockId);
    } catch (error) {
      this.blockExercises[blockId] = previousExercises;
      this.errorMessage = getErrorMessage(error, 'Unable to reorder exercises.');
      console.error('Template editor exercise reorder failed:', error);
    } finally {
      this.finishAction();
      this.changeDetectorRef.detectChanges();
    }
  }

  getBlockExercises(blockId: string): WorkoutTemplateBlockExercise[] {
    return this.blockExercises[blockId] ?? [];
  }

  getExerciseName(exerciseId: string | null): string {
    return this.exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Unknown exercise';
  }

  isAddingExercise(exerciseId: string): boolean {
    return this.activeExerciseSearchBlockId
      ? this.addingExerciseKeys.has(
          this.getAddingExerciseKey(this.activeExerciseSearchBlockId, exerciseId),
        )
      : false;
  }

  isExerciseAlreadyInBlock(blockId: string, exerciseId: string): boolean {
    return this.getBlockExercises(blockId).some(
      (templateExercise) => templateExercise.exerciseId === exerciseId,
    );
  }

  getBlockTypeLabel(blockType: WorkoutTemplateBlockType): string {
    return this.blockTypes.find((type) => type.value === blockType)?.label ?? 'Normal';
  }

  getSetTypeLabel(setType: WorkoutTemplateSetType): string {
    return setType.replace('_', ' ');
  }

  async reloadTemplate(options: { showLoading?: boolean } = {}): Promise<void> {
    const loadId = ++this.mainLoadId;
    const showLoading = options.showLoading ?? true;

    if (showLoading) {
      this.isLoading = true;
      this.startMainLoadingSafetyTimer(loadId);
    }

    this.errorMessage = '';

    try {
      if (!this.templateId) {
        console.error('Template editor load failed before template step: missing route id.');
        throw new Error('Template id is missing.');
      }

      console.info('Template editor loading template:', this.templateId);
      const templateResult = await this.workoutTemplateService.getTemplateById(this.templateId);

      if (loadId !== this.mainLoadId) {
        return;
      }

      if (templateResult.error || !templateResult.data) {
        console.error('Template editor template load error:', {
          templateId: this.templateId,
          error: templateResult.error ?? 'Template not found.',
        });
        throw new Error(templateResult.error ?? 'Template not found.');
      }

      console.info('Template editor loading blocks:', templateResult.data.id);
      const blocksResult = await this.workoutTemplateService.getTemplateBlocks(templateResult.data.id);

      if (loadId !== this.mainLoadId) {
        return;
      }

      if (blocksResult.error) {
        console.error('Template editor blocks load error:', {
          templateId: templateResult.data.id,
          error: blocksResult.error,
        });
        throw new Error(blocksResult.error);
      }

      const nextBlockExercises: Record<string, WorkoutTemplateBlockExercise[]> = {};

      for (const block of blocksResult.data) {
        console.info('Template editor loading block exercises:', block.id);
        const exercisesResult = await this.workoutTemplateService.getTemplateExercises(block.id);

        if (loadId !== this.mainLoadId) {
          return;
        }

        if (exercisesResult.error) {
          console.error('Template editor block exercises load error:', {
            blockId: block.id,
            error: exercisesResult.error,
          });
          throw new Error(exercisesResult.error);
        }

        nextBlockExercises[block.id] = exercisesResult.data;
      }

      this.template = templateResult.data;
      this.blocks = blocksResult.data;
      this.blockExercises = nextBlockExercises;
    } catch (error) {
      this.template = null;
      this.blocks = [];
      this.blockExercises = {};
      this.errorMessage = getErrorMessage(error, 'Unable to load template editor.');
      console.error('Template editor reload failed:', error);
    } finally {
      if (loadId === this.mainLoadId) {
        this.clearMainLoadingSafetyTimer();
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  private async reloadBlockExercises(blockId: string): Promise<void> {
    try {
      const exercisesResult = await this.workoutTemplateService.getTemplateExercises(blockId);

      if (exercisesResult.error) {
        throw new Error(exercisesResult.error);
      }

      this.blockExercises = {
        ...this.blockExercises,
        [blockId]: exercisesResult.data,
      };
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to load block exercises.');
      console.error('Template editor block exercises reload failed:', error);
    } finally {
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadExerciseMetadata(): Promise<void> {
    const metadataLoadId = ++this.metadataLoadId;

    try {
      const [exercisesResult, categoriesResult] = await Promise.all([
        this.exerciseService.getExercises(),
        this.exerciseService.getCategories(),
      ]);

      if (metadataLoadId !== this.metadataLoadId) {
        return;
      }

      if (exercisesResult.error) {
        console.error('Template editor exercises load error:', exercisesResult.error);
      } else {
        this.exercises = exercisesResult.data;
      }

      if (categoriesResult.error) {
        console.error('Template editor categories load error:', categoriesResult.error);
      } else {
        this.categories = categoriesResult.data;
      }
    } catch (error) {
      console.error('Template editor exercise metadata load failed:', error);
    } finally {
      if (metadataLoadId === this.metadataLoadId) {
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  private async saveBlockOrder(): Promise<void> {
    const result = await this.workoutTemplateService.reorderBlocks(this.blocks);

    if (result.error) {
      throw new Error(result.error);
    }
  }

  private async saveExerciseOrder(blockId: string): Promise<void> {
    const result = await this.workoutTemplateService.reorderTemplateExercises(
      this.getBlockExercises(blockId),
    );

    if (result.error) {
      throw new Error(result.error);
    }
  }

  private async updateBlock(
    block: WorkoutTemplateBlock,
    input: { title?: string | null; blockType?: WorkoutTemplateBlockType },
  ): Promise<void> {
    if (!this.canEdit || this.isSaving) {
      return;
    }

    this.beginAction('Saving block...');
    this.errorMessage = '';

    try {
      const result = await this.workoutTemplateService.updateBlock(block.id, input);

      if (result.error || !result.data) {
        throw new Error(result.error ?? 'Unable to update block.');
      }

      this.blocks = this.blocks.map((currentBlock) =>
        currentBlock.id === block.id ? result.data as WorkoutTemplateBlock : currentBlock,
      );
      this.statusMessage = 'Block updated.';
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to update block.');
      console.error('Template editor update block failed:', error);
      await this.reloadTemplate({ showLoading: false });
    } finally {
      this.finishAction();
      this.changeDetectorRef.detectChanges();
    }
  }

  private getAddingExerciseKey(blockId: string, exerciseId: string): string {
    return `${blockId}:${exerciseId}`;
  }

  private beginAction(message: string): void {
    this.isSaving = true;
    this.actionMessage = message;
  }

  private finishAction(): void {
    this.isSaving = false;
    this.actionMessage = '';
  }

  private startMainLoadingSafetyTimer(loadId: number): void {
    this.clearMainLoadingSafetyTimer();
    this.mainLoadingSafetyTimer = setTimeout(() => {
      if (loadId !== this.mainLoadId || !this.isLoading) {
        return;
      }

      this.mainLoadId++;
      this.isLoading = false;
      this.template = null;
      this.blocks = [];
      this.blockExercises = {};
      this.errorMessage = 'Template loading took too long. Please retry.';
      console.error('Template editor main load timed out after 8 seconds.', {
        templateId: this.templateId,
        loadId,
      });
      this.changeDetectorRef.detectChanges();
    }, this.mainLoadingSafetyMs);
  }

  private clearMainLoadingSafetyTimer(): void {
    if (!this.mainLoadingSafetyTimer) {
      return;
    }

    clearTimeout(this.mainLoadingSafetyTimer);
    this.mainLoadingSafetyTimer = null;
  }
}

function getDefaultSetType(blockType: WorkoutTemplateBlockType): WorkoutTemplateSetType {
  if (blockType === 'warmup') {
    return 'warmup';
  }

  if (blockType === 'dropset') {
    return 'dropset';
  }

  if (blockType === 'notes') {
    return 'note';
  }

  return 'working';
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function createEmptyCustomExerciseForm(): CustomExerciseForm {
  return {
    name: '',
    categoryId: null,
    trainingType: '',
    exerciseType: '',
    equipment: '',
    description: '',
  };
}
