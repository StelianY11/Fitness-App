import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('workoutTemplates') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ t('workoutTemplates') }}</h2>
          <p class="mt-2 text-sm leading-5 text-slate-600">
            {{ t('templatesDescription') }}
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
        {{ t('newTemplate') }}
      </button>

      @if (showCreateForm) {
        <form
          class="app-card space-y-4 bg-slate-50 shadow-none"
          (ngSubmit)="createTemplate()"
        >
          <div>
            <h3 class="app-section-title">{{ t('newTemplate') }}</h3>
            <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('templatesDescription') }}</p>
          </div>

          <label class="block">
            <span class="text-sm font-semibold text-slate-700">{{ t('templateName') }}</span>
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
      } @else if (templates.length === 0) {
        <div class="app-card bg-slate-50 p-5 text-center shadow-none">
          <p class="font-semibold text-slate-800">{{ t('noTemplatesYet') }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ t('newTemplate') }}</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (template of templates; track template.id) {
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
                  {{ template.isBuiltin ? t('builtin') : t('mine') }}
                </span>
              </div>

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
                  class="app-button app-button-secondary min-h-11 px-3 py-2"
                >
                  {{ t('edit') }}
                </a>
                <button
                  type="button"
                  (click)="duplicateTemplate(template)"
                  [disabled]="processingTemplateId === template.id"
                  class="app-button app-button-secondary min-h-11 px-3 py-2"
                >
                  {{ processingTemplateId === template.id ? t('loading') : t('duplicate') }}
                </button>
                @if (!template.isBuiltin) {
                  <button
                    type="button"
                    (click)="deleteTemplate(template)"
                    [disabled]="processingTemplateId === template.id"
                    class="app-button app-button-danger min-h-11 px-3 py-2 sm:col-span-4"
                  >
                    {{ t('delete') }}
                  </button>
                }
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class WorkoutTemplatesComponent {
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3];

  templates: WorkoutTemplate[] = [];
  myTemplates: WorkoutTemplate[] = [];
  builtinTemplates: WorkoutTemplate[] = [];
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

  constructor() {
    void this.loadTemplates();
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
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
      this.errorMessage = 'Template name is required.';
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
      this.statusMessage = 'Template created.';
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

      this.statusMessage = 'Template duplicated.';
      await this.loadTemplates();
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to duplicate template.');
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

  async deleteTemplate(template: WorkoutTemplate): Promise<void> {
    if (template.isBuiltin || !confirm(`${this.t('confirmDeleteTemplate')} ${template.name}`)) {
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

      this.statusMessage = 'Template deleted.';
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
      : 'Not set';
  }

  async loadTemplates(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [myTemplatesResult, builtinTemplatesResult] = await Promise.all([
        this.workoutTemplateService.getMyTemplates(),
        this.workoutTemplateService.getBuiltinTemplates(),
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
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
