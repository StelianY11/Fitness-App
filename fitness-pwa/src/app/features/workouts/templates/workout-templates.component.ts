import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LiveWorkoutService } from '../../../core/services/live-workout.service';
import { WorkoutTemplateService } from '../../../core/services/workout-template.service';
import { WorkoutTemplate } from '../../../shared/models/fitness.models';

@Component({
  selector: 'app-workout-templates',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">Workouts</p>
          <h2 class="mt-2 text-3xl font-bold">My Templates</h2>
          <p class="mt-2 text-sm text-slate-600">
            Create reusable plans now. Exercise editing comes in a later phase.
          </p>
        </div>

        <a
          routerLink="/dashboard"
          class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Back
        </a>
      </div>

      <button
        type="button"
        (click)="openCreateForm()"
        class="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white"
      >
        New Template
      </button>

      @if (showCreateForm) {
        <form
          class="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          (ngSubmit)="createTemplate()"
        >
          <div>
            <h3 class="text-lg font-bold text-slate-950">New Template</h3>
            <p class="mt-1 text-sm text-slate-600">Start with a name and optional description.</p>
          </div>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Template name</span>
            <input
              type="text"
              name="templateName"
              [(ngModel)]="newTemplateName"
              required
              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </label>

          <label class="block">
            <span class="text-sm font-medium text-slate-700">Description</span>
            <textarea
              name="templateDescription"
              [(ngModel)]="newTemplateDescription"
              rows="3"
              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            ></textarea>
          </label>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="closeCreateForm()"
              class="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="isSaving || !newTemplateName.trim()"
              class="rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {{ isSaving ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      }

      @if (statusMessage) {
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {{ statusMessage }}
        </p>
      }

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">Unable to load templates</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
        </div>
      } @else if (templates.length === 0) {
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <p class="font-semibold text-slate-800">No templates yet</p>
          <p class="mt-1 text-sm text-slate-600">Create your first reusable workout plan.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (template of templates; track template.id) {
            <article class="rounded-lg border border-slate-200 p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-bold text-slate-950">{{ template.name }}</h3>
                  @if (template.description) {
                    <p class="mt-1 text-sm text-slate-600">{{ template.description }}</p>
                  }
                </div>
                <span
                  class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                  [class.bg-green-100]="template.isBuiltin"
                  [class.text-green-800]="template.isBuiltin"
                  [class.bg-slate-100]="!template.isBuiltin"
                  [class.text-slate-700]="!template.isBuiltin"
                >
                  {{ template.isBuiltin ? 'Builtin' : 'Mine' }}
                </span>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div class="rounded-md bg-slate-50 p-3">
                  <p class="text-xs font-medium text-slate-500">Training type</p>
                  <p class="mt-1 font-semibold text-slate-900">{{ template.goal || 'General' }}</p>
                </div>
                <div class="rounded-md bg-slate-50 p-3">
                  <p class="text-xs font-medium text-slate-500">Duration</p>
                  <p class="mt-1 font-semibold text-slate-900">
                    {{ formatDuration(template) }}
                  </p>
                </div>
              </div>

              <div class="mt-4 grid gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  (click)="startWorkout(template)"
                  [disabled]="processingTemplateId === template.id"
                  class="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {{ processingTemplateId === template.id ? 'Starting...' : 'Start Workout' }}
                </button>
                <a
                  [routerLink]="['/templates', template.id]"
                  class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  View/Edit
                </a>
                <button
                  type="button"
                  (click)="duplicateTemplate(template)"
                  [disabled]="processingTemplateId === template.id"
                  class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  {{ processingTemplateId === template.id ? 'Working...' : 'Duplicate' }}
                </button>
                @if (!template.isBuiltin) {
                  <button
                    type="button"
                    (click)="deleteTemplate(template)"
                    [disabled]="processingTemplateId === template.id"
                    class="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    Delete
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

  constructor() {
    void this.loadTemplates();
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

    this.processingTemplateId = template.id;
    this.errorMessage = '';
    this.statusMessage = '';

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
    if (template.isBuiltin || !confirm(`Delete "${template.name}"?`)) {
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

  private async loadTemplates(): Promise<void> {
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
