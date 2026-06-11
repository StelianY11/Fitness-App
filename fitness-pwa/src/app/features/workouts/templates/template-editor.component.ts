import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ExerciseService } from '../../../core/services/exercise.service';
import { WorkoutTemplateService } from '../../../core/services/workout-template.service';
import {
  Exercise,
  ExerciseCategory,
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
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">Template Builder</p>
          <h2 class="mt-2 text-3xl font-bold">{{ template?.name || 'Template' }}</h2>
          @if (template?.description) {
            <p class="mt-2 text-sm text-slate-600">{{ template?.description }}</p>
          }
        </div>

        <a
          routerLink="/templates"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Back
        </a>
      </div>

      @if (template?.isBuiltin) {
        <p class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Builtin templates are read-only. Duplicate one from the templates list to edit your own copy.
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

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (!template) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">Unable to load template</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage || 'Template not found.' }}</p>
        </div>
      } @else {
        @if (canEdit) {
          <form
            class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            (ngSubmit)="addBlock()"
          >
            <h3 class="text-lg font-bold text-slate-950">Add Block</h3>
            <label class="block">
              <span class="text-sm font-medium text-slate-700">Block title</span>
              <input
                type="text"
                name="newBlockTitle"
                [(ngModel)]="newBlockTitle"
                placeholder="Upper body superset"
                class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </label>

            <label class="block">
              <span class="text-sm font-medium text-slate-700">Block type</span>
              <select
                name="newBlockType"
                [(ngModel)]="newBlockType"
                class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                @for (type of blockTypes; track type.value) {
                  <option [ngValue]="type.value">{{ type.label }}</option>
                }
              </select>
            </label>

            <button
              type="submit"
              [disabled]="isSaving"
              class="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {{ isSaving ? 'Saving...' : 'Add Block' }}
            </button>
          </form>
        }

        @if (blocks.length === 0) {
          <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
            <p class="font-semibold text-slate-800">No blocks yet</p>
            <p class="mt-1 text-sm text-slate-600">Add warmups, normal work, supersets, circuits, or notes.</p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (block of blocks; track block.id; let blockIndex = $index) {
              <article class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wide text-green-700">
                        {{ getBlockTypeLabel(block.blockType) }}
                      </p>
                      @if (canEdit) {
                        <input
                          type="text"
                          [name]="'blockTitle' + block.id"
                          [(ngModel)]="block.title"
                          (blur)="renameBlock(block)"
                          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-lg font-bold text-slate-950 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      } @else {
                        <h3 class="mt-1 text-lg font-bold text-slate-950">
                          {{ block.title || 'Untitled block' }}
                        </h3>
                      }
                    </div>

                    @if (canEdit) {
                      <button
                        type="button"
                        (click)="removeBlock(block)"
                        class="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    }
                  </div>

                  @if (canEdit) {
                    <div class="grid grid-cols-3 gap-2">
                      <select
                        [name]="'blockType' + block.id"
                        [(ngModel)]="block.blockType"
                        (ngModelChange)="updateBlockType(block)"
                        class="col-span-3 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      >
                        @for (type of blockTypes; track type.value) {
                          <option [ngValue]="type.value">{{ type.label }}</option>
                        }
                      </select>
                      <button
                        type="button"
                        (click)="moveBlock(blockIndex, -1)"
                        [disabled]="blockIndex === 0 || isSaving"
                        class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        (click)="moveBlock(blockIndex, 1)"
                        [disabled]="blockIndex === blocks.length - 1 || isSaving"
                        class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        (click)="openExerciseSearch(block.id)"
                        class="rounded-md border border-green-600 px-3 py-2 text-sm font-semibold text-green-700"
                      >
                        Add Exercise
                      </button>
                    </div>
                  }

                  @if (activeExerciseSearchBlockId === block.id) {
                    <div class="space-y-3 rounded-md bg-slate-50 p-3">
                      <label class="block">
                        <span class="text-sm font-medium text-slate-700">Search exercises</span>
                        <input
                          type="search"
                          name="exerciseSearch"
                          [(ngModel)]="exerciseSearchQuery"
                          (ngModelChange)="searchExercises($event)"
                          placeholder="Search by exercise name"
                          class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </label>

                      @if (isSearchingExercises) {
                        <p class="text-sm text-slate-600">Searching...</p>
                      } @else if (exerciseSearchResults.length === 0) {
                        @if (hasSearchedExercises && exerciseSearchQuery.trim()) {
                          <div class="space-y-3 rounded-md border border-dashed border-slate-300 bg-white p-4">
                            <div>
                              <p class="font-semibold text-slate-900">Exercise not found</p>
                              <p class="mt-1 text-sm text-slate-600">
                                Create a private exercise and add it to this block.
                              </p>
                            </div>
                            <button
                              type="button"
                              (click)="openCustomExerciseForm(block.id)"
                              class="rounded-md border border-green-600 px-3 py-2 text-sm font-semibold text-green-700"
                            >
                              + Create custom exercise
                            </button>
                          </div>
                        } @else {
                          <p class="text-sm text-slate-600">Search for an exercise to add.</p>
                        }
                      } @else {
                        <div class="space-y-2">
                          @for (exercise of exerciseSearchResults; track exercise.id) {
                            <button
                              type="button"
                              (click)="addExercise(block, exercise)"
                              [disabled]="isAddingExercise(exercise.id) || isExerciseAlreadyInBlock(block.id, exercise.id)"
                              class="flex w-full items-start justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-left"
                              [class.cursor-not-allowed]="isAddingExercise(exercise.id) || isExerciseAlreadyInBlock(block.id, exercise.id)"
                              [class.opacity-60]="isAddingExercise(exercise.id) || isExerciseAlreadyInBlock(block.id, exercise.id)"
                            >
                              <span>
                                <span class="block font-semibold text-slate-950">{{ exercise.name }}</span>
                                <span class="mt-1 block text-sm text-slate-600">
                                  {{ exercise.equipment || 'No equipment' }}
                                </span>
                              </span>
                              <span class="text-sm font-semibold text-green-700">
                                @if (isExerciseAlreadyInBlock(block.id, exercise.id)) {
                                  Already added
                                } @else if (isAddingExercise(exercise.id)) {
                                  Adding...
                                } @else {
                                  Add
                                }
                              </span>
                            </button>
                          }
                        </div>
                      }

                      @if (customExerciseBlockId === block.id) {
                        <form
                          class="space-y-3 rounded-md border border-slate-200 bg-white p-4"
                          (ngSubmit)="createCustomExercise(block)"
                        >
                          <div>
                            <h4 class="font-bold text-slate-950">Create custom exercise</h4>
                            <p class="mt-1 text-sm text-slate-600">This will be saved as your private exercise.</p>
                          </div>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">Name</span>
                            <input
                              type="text"
                              name="customExerciseName"
                              [(ngModel)]="customExercise.name"
                              required
                              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                          </label>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">Category</span>
                            <select
                              name="customExerciseCategory"
                              [(ngModel)]="customExercise.categoryId"
                              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            >
                              <option [ngValue]="null">No category</option>
                              @for (category of categories; track category.id) {
                                <option [ngValue]="category.id">{{ category.name }}</option>
                              }
                            </select>
                          </label>

                          <div class="grid gap-3 sm:grid-cols-2">
                            <label class="block">
                              <span class="text-sm font-medium text-slate-700">Training type</span>
                              <input
                                type="text"
                                name="customExerciseTrainingType"
                                [(ngModel)]="customExercise.trainingType"
                                placeholder="gym, calisthenics"
                                class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                              />
                            </label>

                            <label class="block">
                              <span class="text-sm font-medium text-slate-700">Exercise type</span>
                              <input
                                type="text"
                                name="customExerciseExerciseType"
                                [(ngModel)]="customExercise.exerciseType"
                                placeholder="bodyweight, gym"
                                class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                              />
                            </label>
                          </div>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">Equipment</span>
                            <input
                              type="text"
                              name="customExerciseEquipment"
                              [(ngModel)]="customExercise.equipment"
                              placeholder="Dumbbells, bodyweight, machine"
                              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            />
                          </label>

                          <label class="block">
                            <span class="text-sm font-medium text-slate-700">Notes</span>
                            <textarea
                              name="customExerciseDescription"
                              [(ngModel)]="customExercise.description"
                              rows="3"
                              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                            ></textarea>
                          </label>

                          <div class="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              (click)="closeCustomExerciseForm()"
                              class="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              [disabled]="isCreatingCustomExercise || !customExercise.name.trim()"
                              class="rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {{ isCreatingCustomExercise ? 'Creating...' : 'Create & Add' }}
                            </button>
                          </div>
                        </form>
                      }
                    </div>
                  }

                  @if (getBlockExercises(block.id).length === 0) {
                    <div class="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
                      No exercises in this block yet.
                    </div>
                  } @else {
                    <div class="space-y-2">
                      @for (templateExercise of getBlockExercises(block.id); track templateExercise.id; let exerciseIndex = $index) {
                        <div class="rounded-md border border-slate-200 p-3">
                          <div class="flex items-start justify-between gap-3">
                            <div>
                              <p class="font-semibold text-slate-950">
                                {{ getExerciseName(templateExercise.exerciseId) }}
                              </p>
                              <p class="mt-1 text-sm text-slate-600">
                                {{ getSetTypeLabel(templateExercise.setType) }}
                              </p>
                            </div>

                            @if (canEdit) {
                              <button
                                type="button"
                                (click)="removeExercise(templateExercise)"
                                class="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                              >
                                Remove
                              </button>
                            }
                          </div>

                          @if (canEdit) {
                            <div class="mt-3 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                (click)="moveExercise(block.id, exerciseIndex, -1)"
                                [disabled]="exerciseIndex === 0 || isSaving"
                                class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                              >
                                Up
                              </button>
                              <button
                                type="button"
                                (click)="moveExercise(block.id, exerciseIndex, 1)"
                                [disabled]="exerciseIndex === getBlockExercises(block.id).length - 1 || isSaving"
                                class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                              >
                                Down
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
    </div>
  `,
})
export class TemplateEditorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

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
  isSearchingExercises = false;
  isCreatingCustomExercise = false;
  errorMessage = '';
  statusMessage = '';
  private readonly addingExerciseKeys = new Set<string>();
  private searchRequestId = 0;
  private readonly loadTimeoutMs = 15000;

  get canEdit(): boolean {
    return this.template?.isBuiltin === false;
  }

  constructor() {
    void this.loadTemplateEditor();
  }

  async addBlock(): Promise<void> {
    if (!this.template || !this.canEdit) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.createBlock({
        workoutTemplateId: this.template.id,
        title: this.newBlockTitle.trim() || this.getBlockTypeLabel(this.newBlockType),
        blockType: this.newBlockType,
        sortOrder: this.blocks.length + 1,
      });

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.newBlockTitle = '';
      this.newBlockType = 'normal';
      this.statusMessage = 'Block added.';
      await this.loadBlocks();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to add block.');
    } finally {
      this.isSaving = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async renameBlock(block: WorkoutTemplateBlock): Promise<void> {
    await this.updateBlock(block, { title: block.title?.trim() || 'Untitled block' });
  }

  async updateBlockType(block: WorkoutTemplateBlock): Promise<void> {
    await this.updateBlock(block, { blockType: block.blockType });
  }

  async removeBlock(block: WorkoutTemplateBlock): Promise<void> {
    if (!this.canEdit || !confirm(`Remove "${block.title || 'this block'}"?`)) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.deleteBlock(block.id);

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.statusMessage = 'Block removed.';
      await this.loadBlocks();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to remove block.');
    } finally {
      this.isSaving = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async moveBlock(index: number, direction: -1 | 1): Promise<void> {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= this.blocks.length) {
      return;
    }

    const reorderedBlocks = [...this.blocks];
    [reorderedBlocks[index], reorderedBlocks[targetIndex]] = [
      reorderedBlocks[targetIndex],
      reorderedBlocks[index],
    ];

    this.blocks = reorderedBlocks.map((block, blockIndex) => ({
      ...block,
      sortOrder: blockIndex + 1,
    }));

    const result = await this.workoutTemplateService.reorderBlocks(this.blocks);

    if (result.error) {
      this.errorMessage = result.error;
      await this.loadBlocks();
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
    if (!this.canEdit) {
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

    try {
      const existingExercises = this.getBlockExercises(block.id);
      const result = await this.workoutTemplateService.addExerciseToBlock({
        workoutTemplateBlockId: block.id,
        exerciseId: exercise.id,
        sortOrder: existingExercises.length + 1,
        setType: getDefaultSetType(block.blockType),
      });

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.statusMessage = 'Exercise added.';
      await this.loadBlockExercises(block.id);
    } catch (error) {
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
    if (!this.canEdit) {
      return;
    }

    const result = await this.workoutTemplateService.deleteTemplateExercise(templateExercise.id);

    if (result.error) {
      this.errorMessage = result.error;
      return;
    }

    this.statusMessage = 'Exercise removed.';
    await this.loadBlockExercises(templateExercise.workoutTemplateBlockId);
  }

  async moveExercise(blockId: string, index: number, direction: -1 | 1): Promise<void> {
    const exercises = [...this.getBlockExercises(blockId)];
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= exercises.length) {
      return;
    }

    [exercises[index], exercises[targetIndex]] = [exercises[targetIndex], exercises[index]];
    this.blockExercises[blockId] = exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      sortOrder: exerciseIndex + 1,
    }));

    const result = await this.workoutTemplateService.reorderTemplateExercises(
      this.blockExercises[blockId],
    );

    if (result.error) {
      this.errorMessage = result.error;
      await this.loadBlockExercises(blockId);
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

  private async loadTemplateEditor(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const templateId = this.route.snapshot.paramMap.get('id');

      if (!templateId) {
        this.errorMessage = 'Template id is missing.';
        console.error('Template editor load error: missing route id.');
        return;
      }

      const templateResult = await withLoadTimeout(
        this.workoutTemplateService.getTemplateById(templateId),
        'template',
        this.loadTimeoutMs,
      );

      if (templateResult.error || !templateResult.data) {
        this.errorMessage = templateResult.error ?? 'Template not found.';
        console.error('Template editor template load error:', this.errorMessage);
        return;
      }

      this.template = templateResult.data;
      await this.loadBlocks();
      void this.loadExerciseMetadata();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to load template editor.');
      console.error('Template editor load failed:', error);
    } finally {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadBlocks(): Promise<void> {
    if (!this.template) {
      return;
    }

    const blocksResult = await withLoadTimeout(
      this.workoutTemplateService.getTemplateBlocks(this.template.id),
      'template blocks',
      this.loadTimeoutMs,
    );

    if (blocksResult.error) {
      this.errorMessage = blocksResult.error;
      console.error('Template editor blocks load error:', blocksResult.error);
      return;
    }

    this.blocks = blocksResult.data;
    this.blockExercises = {};

    for (const block of this.blocks) {
      await this.loadBlockExercises(block.id);
    }
  }

  private async loadBlockExercises(blockId: string): Promise<void> {
    const exercisesResult = await withLoadTimeout(
      this.workoutTemplateService.getTemplateExercises(blockId),
      'template block exercises',
      this.loadTimeoutMs,
    );

    if (exercisesResult.error) {
      this.errorMessage = exercisesResult.error;
      console.error('Template editor block exercises load error:', exercisesResult.error);
      return;
    }

    this.blockExercises = {
      ...this.blockExercises,
      [blockId]: exercisesResult.data,
    };
  }

  private async loadExerciseMetadata(): Promise<void> {
    try {
      const [exercisesResult, categoriesResult] = await Promise.all([
        withLoadTimeout(this.exerciseService.getExercises(), 'exercises', this.loadTimeoutMs),
        withLoadTimeout(this.exerciseService.getCategories(), 'exercise categories', this.loadTimeoutMs),
      ]);

      if (exercisesResult.error) {
        this.errorMessage = exercisesResult.error;
        console.error('Template editor exercises load error:', exercisesResult.error);
      } else {
        this.exercises = exercisesResult.data;
      }

      if (categoriesResult.error) {
        this.errorMessage = categoriesResult.error;
        console.error('Template editor categories load error:', categoriesResult.error);
      } else {
        this.categories = categoriesResult.data;
      }
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to load exercise metadata.');
      console.error('Template editor exercise metadata load failed:', error);
    } finally {
      this.changeDetectorRef.detectChanges();
    }
  }

  private async updateBlock(
    block: WorkoutTemplateBlock,
    input: { title?: string | null; blockType?: WorkoutTemplateBlockType },
  ): Promise<void> {
    if (!this.canEdit) {
      return;
    }

    const result = await this.workoutTemplateService.updateBlock(block.id, input);

    if (result.error) {
      this.errorMessage = result.error;
      return;
    }

    this.statusMessage = 'Block updated.';
  }

  private getAddingExerciseKey(blockId: string, exerciseId: string): string {
    return `${blockId}:${exerciseId}`;
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

function withLoadTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timed out while loading ${label}.`));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
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
