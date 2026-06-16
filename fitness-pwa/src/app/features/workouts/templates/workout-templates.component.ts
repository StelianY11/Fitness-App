import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LiveWorkoutService } from '../../../core/services/live-workout.service';
import { TranslationService } from '../../../core/services/translation.service';
import { WorkoutTemplateService } from '../../../core/services/workout-template.service';
import { WorkoutSession, WorkoutTemplate } from '../../../shared/models/fitness.models';

@Component({
  selector: 'app-workout-templates',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('workouts') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">
            {{ activeSection === 'mine' ? t('myWorkouts') : t('readyWorkouts') }}
          </h2>
          <p class="mt-2 text-sm leading-5 text-slate-600">
            {{ t('workoutsDescription') }}
          </p>
        </div>

        <a
          routerLink="/dashboard"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('back') }}
        </a>
      </header>

      <button
        type="button"
        (click)="openCreateForm()"
        class="app-button app-button-primary"
      >
        {{ t('newWorkout') }}
      </button>

      @if (showCreateForm) {
        <form
          class="app-card space-y-4 bg-slate-50 shadow-none"
          (ngSubmit)="createTemplate()"
        >
          <div>
            <h3 class="app-section-title">{{ t('newWorkout') }}</h3>
            <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('workoutsDescription') }}</p>
          </div>

          <label class="block">
            <span class="text-sm font-semibold text-slate-700">{{ t('workoutName') }}</span>
            <input
              type="text"
              name="templateName"
              [(ngModel)]="newTemplateName"
              required
              class="app-input mt-2"
            />
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-700">{{ t('description') }}</span>
            <textarea
              name="templateDescription"
              [(ngModel)]="newTemplateDescription"
              rows="3"
              class="app-input mt-2"
            ></textarea>
          </label>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="closeCreateForm()"
              class="app-button app-button-secondary"
            >
              {{ t('cancel') }}
            </button>
            <button
              type="submit"
              [disabled]="isSaving || !newTemplateName.trim()"
              class="app-button app-button-primary"
            >
              {{ isSaving ? t('loading') : t('create') }}
            </button>
          </div>
        </form>
      }

      @if (statusMessage) {
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {{ statusMessage }}
        </p>
      }

      @if (showActiveWorkoutPrompt && activeWorkout) {
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 class="text-lg font-bold text-amber-950">{{ t('activeWorkout') }}</h3>
          <p class="mt-2 text-sm text-amber-800">
            {{ t('activeWorkoutNewPrompt') }}
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
              [disabled]="processingTemplateId === pendingStartTemplate?.id"
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
            <div class="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('error') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          <button
            type="button"
            (click)="loadTemplates()"
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else {
        <section class="space-y-4">
          <div class="grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              (click)="activeSection = 'mine'"
              class="app-button min-h-11 px-3 py-2"
              [class.app-button-primary]="activeSection === 'mine'"
              [class.app-button-secondary]="activeSection !== 'mine'"
            >
              {{ t('myWorkouts') }}
            </button>
            <button
              type="button"
              (click)="activeSection = 'ready'"
              class="app-button min-h-11 px-3 py-2"
              [class.app-button-primary]="activeSection === 'ready'"
              [class.app-button-secondary]="activeSection !== 'ready'"
            >
              {{ t('readyWorkouts') }}
            </button>
          </div>

          @if (displayedTemplates.length === 0) {
            <div class="app-card bg-slate-50 p-5 text-center shadow-none">
              <p class="font-semibold text-slate-800">
                {{ activeSection === 'mine' ? t('noMyWorkoutsYet') : t('noReadyWorkoutsYet') }}
              </p>
              <p class="mt-1 text-sm text-slate-600">
                {{ activeSection === 'mine' ? t('newWorkout') : t('readyWorkoutsDescription') }}
              </p>
            </div>
          }

          @for (template of displayedTemplates; track template.id) {
            <article class="app-card space-y-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-lg font-bold leading-6 text-slate-950">{{ template.name }}</h3>
                  @if (template.description) {
                    <p class="mt-1 text-sm leading-5 text-slate-600">{{ template.description }}</p>
                  }
                </div>
                <span
                  class="app-badge shrink-0"
                  [class.bg-green-100]="template.isBuiltin"
                  [class.text-green-800]="template.isBuiltin"
                  [class.bg-slate-100]="!template.isBuiltin"
                  [class.text-slate-700]="!template.isBuiltin"
                >
                  {{ getTemplateBadge(template) }}
                </span>
              </div>

              @if (template.isBuiltin || template.visibility === 'builtin') {
                <p class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {{ t('officialWorkout') }}
                </p>
              }

              @if (template.visibility === 'shared') {
                <p class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {{ t('sharedBy') }} {{ getSharedByName(template) }}
                </p>
              }

              <div class="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-sm">
                <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p class="text-xs font-medium text-slate-500">{{ t('trainingType') }}</p>
                  <p class="mt-1 font-bold text-slate-900">{{ template.goal || t('general') }}</p>
                </div>
                <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p class="text-xs font-medium text-slate-500">{{ t('duration') }}</p>
                  <p class="mt-1 font-bold text-slate-900">
                    {{ formatDuration(template) }}
                  </p>
                </div>
              </div>

              <div class="grid gap-2 border-t border-slate-200 pt-3 sm:grid-cols-4">
                <button
                  type="button"
                  (click)="startWorkout(template)"
                  [disabled]="processingTemplateId === template.id"
                  class="app-button app-button-primary min-h-11 px-3 py-2 sm:col-span-2"
                >
                  {{ processingTemplateId === template.id ? t('loading') : t('startWorkout') }}
                </button>
                <a
                  [routerLink]="['/templates', template.id]"
                  [queryParams]="activeSection === 'ready' ? { mode: 'view' } : null"
                  class="app-button app-button-secondary min-h-11 px-3 py-2"
                >
                  {{ getTemplateOpenLabel(template) }}
                </a>
                @if (activeSection === 'ready' && canCopyReadyTemplate(template)) {
                  <button
                    type="button"
                    (click)="duplicateTemplate(template)"
                    [disabled]="processingTemplateId === template.id"
                    class="app-button app-button-secondary min-h-11 px-3 py-2"
                  >
                    {{ processingTemplateId === template.id ? t('loading') : t('copyToMyWorkouts') }}
                  </button>
                }
                @if (activeSection === 'mine' && template.visibility === 'private' && canEditTemplate(template)) {
                  <button
                    type="button"
                    (click)="shareTemplate(template)"
                    [disabled]="processingTemplateId === template.id"
                    class="app-button app-button-secondary min-h-11 px-3 py-2 sm:col-span-2"
                  >
                    {{ processingTemplateId === template.id ? t('loading') : t('share') }}
                  </button>
                }
                @if (template.visibility === 'shared' && canEditTemplate(template)) {
                  <button
                    type="button"
                    (click)="unshareTemplate(template)"
                    [disabled]="processingTemplateId === template.id"
                    class="app-button app-button-secondary min-h-11 px-3 py-2 sm:col-span-2"
                  >
                    {{ processingTemplateId === template.id ? t('loading') : t('unshare') }}
                  </button>
                }
                @if (activeSection === 'mine' && canEditTemplate(template)) {
                  <button
                    type="button"
                    (click)="openDeleteTemplateModal(template)"
                    [disabled]="processingTemplateId === template.id"
                    class="app-button app-button-danger min-h-11 px-3 py-2 sm:col-span-4"
                  >
                    {{ t('delete') }}
                  </button>
                }
              </div>
            </article>
          }
        </section>
      }

      @if (templatePendingDelete) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="app-card w-full p-4 sm:max-w-lg">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-red-700">{{ t('delete') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('deleteTemplateModalTitle') }}</h3>
              <p class="mt-2 text-sm leading-5 text-slate-600">
                {{ t('deleteTemplateDescription') }}
              </p>
            </div>

            <div class="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <p class="font-bold text-slate-950">{{ templatePendingDelete.name }}</p>
              @if (templatePendingDelete.description) {
                <p class="mt-1 leading-5 text-slate-600">{{ templatePendingDelete.description }}</p>
              }
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="confirmDeleteTemplate()"
                [disabled]="processingTemplateId === templatePendingDelete.id"
                class="app-button app-button-danger"
              >
                {{ processingTemplateId === templatePendingDelete.id ? t('loading') : t('delete') }}
              </button>
              <button
                type="button"
                (click)="closeDeleteTemplateModal()"
                [disabled]="processingTemplateId === templatePendingDelete.id"
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
export class WorkoutTemplatesComponent {
  private readonly authService = inject(AuthService);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  templates: WorkoutTemplate[] = [];
  myTemplates: WorkoutTemplate[] = [];
  builtinTemplates: WorkoutTemplate[] = [];
  activeSection: 'mine' | 'ready' = 'mine';
  currentUserId = '';
  isLoading = true;
  isSaving = false;
  showCreateForm = false;
  newTemplateName = '';
  newTemplateDescription = '';
  errorMessage = '';
  statusMessage = '';
  processingTemplateId: string | null = null;
  activeWorkout: WorkoutSession | null = null;
  pendingStartTemplate: WorkoutTemplate | null = null;
  showActiveWorkoutPrompt = false;
  templatePendingDelete: WorkoutTemplate | null = null;

  constructor() {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    this.activeSection = tab === 'ready' ? 'ready' : 'mine';
    void this.loadCurrentUser();
    void this.loadTemplates();
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }

  get displayedTemplates(): WorkoutTemplate[] {
    return this.activeSection === 'mine' ? this.myTemplates : this.builtinTemplates;
  }

  canEditTemplate(template: WorkoutTemplate): boolean {
    return !template.isBuiltin && template.ownerId === this.currentUserId;
  }

  canCopyReadyTemplate(template: WorkoutTemplate): boolean {
    return this.activeSection === 'ready' && (template.isBuiltin || template.ownerId !== this.currentUserId);
  }

  getTemplateOpenLabel(template: WorkoutTemplate): string {
    return this.activeSection === 'mine' && this.canEditTemplate(template)
      ? this.t('edit')
      : this.t('view');
  }

  getTemplateBadge(template: WorkoutTemplate): string {
    if (template.visibility === 'shared') {
      return this.t('shared');
    }

    return template.isBuiltin || template.visibility === 'builtin'
      ? this.t('readyWorkout')
      : this.t('myWorkout');
  }

  getSharedByName(template: WorkoutTemplate): string {
    return template.sharedBy === this.currentUserId
      ? this.t('you')
      : template.sharedByName ?? this.t('sharedWorkout');
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.statusMessage = '';
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.newTemplateName = '';
    this.newTemplateDescription = '';
  }

  async createTemplate(): Promise<void> {
    const name = this.newTemplateName.trim();

    if (!name) {
      this.errorMessage = this.t('templateNameRequired');
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.createTemplate({
        name,
        description: this.newTemplateDescription.trim() || null,
      });

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.closeCreateForm();
      this.statusMessage = this.t('workoutCreated');
      await this.loadTemplates();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to create template.');
    } finally {
      this.isSaving = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async duplicateTemplate(template: WorkoutTemplate): Promise<void> {
    this.processingTemplateId = template.id;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.duplicateTemplate(template.id);

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.statusMessage = this.activeSection === 'ready'
        ? this.t('workoutCopied')
        : this.t('workoutDuplicated');
      await this.loadTemplates();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to duplicate template.');
    } finally {
      this.processingTemplateId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  async shareTemplate(template: WorkoutTemplate): Promise<void> {
    if (!this.canEditTemplate(template) || this.processingTemplateId) {
      return;
    }

    this.processingTemplateId = template.id;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.shareTemplate(template.id);

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.statusMessage = this.t('workoutShared');
      await this.loadTemplates();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to share workout.');
    } finally {
      this.processingTemplateId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  async unshareTemplate(template: WorkoutTemplate): Promise<void> {
    if (!this.canEditTemplate(template) || this.processingTemplateId) {
      return;
    }

    this.processingTemplateId = template.id;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.unshareTemplate(template.id);

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.statusMessage = this.t('workoutUnshared');
      await this.loadTemplates();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to unshare workout.');
    } finally {
      this.processingTemplateId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  async startWorkout(template: WorkoutTemplate): Promise<void> {
    if (this.processingTemplateId) {
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
        this.pendingStartTemplate = template;
        this.showActiveWorkoutPrompt = true;
        return;
      }

      await this.startNewWorkout(template);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to start workout.');
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
    if (!this.activeWorkout || !this.pendingStartTemplate || this.processingTemplateId) {
      return;
    }

    const template = this.pendingStartTemplate;
    this.processingTemplateId = template.id;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const cancelResult = await this.liveWorkoutService.cancelWorkout(this.activeWorkout.id);

      if (cancelResult.error) {
        this.errorMessage = cancelResult.error;
        return;
      }

      this.closeActiveWorkoutPrompt();
      await this.startNewWorkout(template);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to start workout.');
    } finally {
      this.processingTemplateId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  closeActiveWorkoutPrompt(): void {
    this.showActiveWorkoutPrompt = false;
    this.pendingStartTemplate = null;
  }

  private async startNewWorkout(template: WorkoutTemplate): Promise<void> {
    this.processingTemplateId = template.id;

    try {
      const result = await this.liveWorkoutService.startWorkoutFromTemplate(template.id);

      if (result.error || !result.data) {
        this.errorMessage = result.error ?? 'Unable to start workout.';
        return;
      }

      await this.router.navigate(['/workout/live', result.data.id]);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to start workout.');
    } finally {
      this.processingTemplateId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  openDeleteTemplateModal(template: WorkoutTemplate): void {
    if (!this.canEditTemplate(template) || this.processingTemplateId === template.id) {
      return;
    }

    this.templatePendingDelete = template;
  }

  closeDeleteTemplateModal(): void {
    if (this.templatePendingDelete && this.processingTemplateId === this.templatePendingDelete.id) {
      return;
    }

    this.templatePendingDelete = null;
  }

  async confirmDeleteTemplate(): Promise<void> {
    const template = this.templatePendingDelete;

    if (!template || !this.canEditTemplate(template)) {
      return;
    }

    this.processingTemplateId = template.id;
    this.errorMessage = '';
    this.statusMessage = '';

    try {
      const result = await this.workoutTemplateService.deleteTemplate(template.id);

      if (result.error) {
        this.errorMessage = result.error;
        return;
      }

      this.statusMessage = this.t('templateDeleted');
      this.templatePendingDelete = null;
      await this.loadTemplates();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to delete template.');
    } finally {
      this.processingTemplateId = null;
      this.changeDetectorRef.detectChanges();
    }
  }

  formatDuration(template: WorkoutTemplate): string {
    return template.estimatedDurationMinutes
      ? `${template.estimatedDurationMinutes} min`
      : this.t('notSet');
  }

  async loadTemplates(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [myTemplatesResult, builtinTemplatesResult] = await Promise.all([
        this.workoutTemplateService.getMyTemplates(),
        this.workoutTemplateService.getReadyTemplates(),
      ]);

      this.myTemplates = myTemplatesResult.data;
      this.builtinTemplates = builtinTemplatesResult.data;
      this.templates = [...this.myTemplates, ...this.builtinTemplates];
      this.errorMessage = myTemplatesResult.error ?? builtinTemplatesResult.error ?? '';

      if (this.errorMessage) {
        console.error('Workout templates load error:', this.errorMessage);
      }
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to load templates.');
      console.error('Workout templates load failed:', error);
    } finally {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadCurrentUser(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    this.currentUserId = user?.id ?? '';
    this.changeDetectorRef.detectChanges();
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
