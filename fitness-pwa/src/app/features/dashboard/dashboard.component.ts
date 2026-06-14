import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkoutTemplateService } from '../../core/services/workout-template.service';
import { WorkoutSession, WorkoutTemplate } from '../../shared/models/fitness.models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <header class="space-y-3">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('brandLabel') }}</p>
        <div>
          <p class="text-sm font-semibold text-slate-500">{{ t('dashboardGreeting') }}</p>
          <h2 class="mt-1 text-3xl font-bold leading-tight tracking-tight text-slate-950">{{ dashboardName }}</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ t('trackYourTraining') }}</p>
        </div>
      </header>

      @if (activeWorkout) {
        <section class="app-card border-green-200 bg-green-50 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{{ t('liveSession') }}</p>
              <h3 class="mt-2 text-2xl font-bold leading-tight text-slate-950">{{ activeWorkoutName }}</h3>
            </div>
            <span class="app-badge bg-green-100 text-green-800 shrink-0">{{ t('activeWorkout') }}</span>
          </div>

          <div class="grid grid-cols-2 gap-2.5 text-sm">
            <div class="rounded-md border border-green-200 bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('started') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ formatTime(activeWorkout.startedAt) }}</p>
            </div>
            <div class="rounded-md border border-green-200 bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('elapsed') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ formatElapsed(activeWorkout.startedAt) }}</p>
            </div>
            <div class="rounded-md border border-green-200 bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ activeWorkoutExerciseCount }}</p>
            </div>
            <div class="rounded-md border border-green-200 bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ activeWorkoutSetCount }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="resumeWorkout()"
              class="app-button app-button-primary"
            >
              {{ t('resumeWorkout') }}
            </button>
            <button
              type="button"
              (click)="cancelActiveWorkout()"
              [disabled]="isCancellingActiveWorkout"
              class="app-button app-button-danger"
            >
              {{ isCancellingActiveWorkout ? t('loading') : t('cancelWorkout') }}
            </button>
          </div>
        </section>
      }

      <section class="space-y-3">
        <a
          routerLink="/exercises"
          class="app-card block border-green-200 bg-green-50"
        >
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-green-700">{{ t('startStrong') }}</p>
          <div class="mt-2 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-lg font-bold leading-6 text-slate-950">{{ t('exerciseLibrary') }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('exerciseLibraryDescription') }}</p>
            </div>
            <span class="app-badge bg-green-100 text-green-800">{{ t('open') }}</span>
          </div>
        </a>

        <a
          routerLink="/templates"
          class="app-card block"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-base font-bold leading-6 text-slate-950">{{ t('workoutTemplates') }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('templatesDescription') }}</p>
            </div>
            <span class="app-badge">{{ t('open') }}</span>
          </div>
        </a>

        <a
          routerLink="/history"
          class="app-card block"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-base font-bold leading-6 text-slate-950">{{ t('history') }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('workoutHistory') }}</p>
            </div>
            <span class="app-badge">{{ t('open') }}</span>
          </div>
        </a>

        <a
          routerLink="/settings"
          class="app-card block"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <h3 class="text-base font-bold leading-6 text-slate-950">{{ t('settings') }}</h3>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('settingsDescription') }}</p>
            </div>
            <span class="app-badge">{{ t('open') }}</span>
          </div>
        </a>
      </section>

      @if (errorMessage) {
        <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>
      }

      <button
        type="button"
        (click)="logout()"
        [disabled]="isLoading"
        class="app-button app-button-secondary"
      >
        {{ isLoading ? t('loading') : t('logout') }}
      </button>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly translationService = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  userEmail = '';
  activeWorkout: WorkoutSession | null = null;
  activeWorkoutName = 'Workout';
  activeWorkoutExerciseCount = 0;
  activeWorkoutSetCount = 0;
  isLoading = false;
  isActiveWorkoutLoading = true;
  isCancellingActiveWorkout = false;
  errorMessage = '';

  constructor() {
    this.authService.getCurrentUser().then((user) => {
      this.userEmail = user?.email ?? '';
    });
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }

  get dashboardName(): string {
    const displayName = this.appSettingsService.settings().displayName.trim();

    return displayName || this.userEmail || this.t('athlete');
  }

  ngOnInit(): void {
    void this.loadActiveWorkout();
  }

  async resumeWorkout(): Promise<void> {
    const activeWorkout = this.liveWorkoutService.activeWorkout();

    if (!activeWorkout) {
      return;
    }

    await this.router.navigate(['/workout/live', activeWorkout.id]);
  }

  async cancelActiveWorkout(): Promise<void> {
    const activeWorkout = this.liveWorkoutService.activeWorkout();

    if (!activeWorkout || this.isCancellingActiveWorkout || !confirm(this.t('confirmCancelActiveWorkout'))) {
      return;
    }

    this.isCancellingActiveWorkout = true;
    this.errorMessage = '';

    try {
      const result = await this.liveWorkoutService.cancelWorkout(activeWorkout.id);

      if (result.error) {
        throw new Error(result.error);
      }

      this.activeWorkout = null;
      this.activeWorkoutName = 'Workout';
      this.activeWorkoutExerciseCount = 0;
      this.activeWorkoutSetCount = 0;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to cancel workout.';
    } finally {
      this.isCancellingActiveWorkout = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async logout(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.signOut();
      await this.router.navigateByUrl('/login');
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to log out.';
    } finally {
      this.isLoading = false;
    }
  }

  formatTime(value: string): string {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatElapsed(value: string): string {
    const minutes = Math.max(
      1,
      Math.round((Date.now() - new Date(value).getTime()) / 60000),
    );

    return `${minutes} min`;
  }

  private async loadActiveWorkout(): Promise<void> {
    this.isActiveWorkoutLoading = true;
    this.activeWorkout = null;
    this.activeWorkoutName = 'Workout';
    this.activeWorkoutExerciseCount = 0;
    this.activeWorkoutSetCount = 0;

    try {
      await this.authService.getSession();
      const result = await this.liveWorkoutService.refreshActiveWorkout();

      if (result.error) {
        this.errorMessage = result.error;
        console.error('Dashboard active workout lookup failed:', result.error);
        return;
      }

      if (!result.data) {
        return;
      }

      this.activeWorkout = result.data;
      this.activeWorkoutName = await this.getWorkoutName(result.data);
      await this.loadActiveWorkoutCounts(result.data);
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load active workout.';
    } finally {
      this.isActiveWorkoutLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private async loadActiveWorkoutCounts(session: WorkoutSession | null): Promise<void> {
    this.activeWorkoutExerciseCount = 0;
    this.activeWorkoutSetCount = 0;

    if (!session) {
      return;
    }

    const exercisesResult = await this.liveWorkoutService.getWorkoutExercises(session.id);

    if (exercisesResult.error) {
      console.error('Dashboard active workout exercise count failed:', exercisesResult.error);
      return;
    }

    this.activeWorkoutExerciseCount = exercisesResult.data.length;

    for (const workoutExercise of exercisesResult.data) {
      const setsResult = await this.liveWorkoutService.getWorkoutSets(workoutExercise.id);

      if (setsResult.error) {
        console.error('Dashboard active workout set count failed:', setsResult.error);
        continue;
      }

      this.activeWorkoutSetCount += setsResult.data.length;
    }
  }

  private async getWorkoutName(session: WorkoutSession | null): Promise<string> {
    if (!session?.workoutTemplateId) {
      return 'Workout';
    }

    const templateResult = await this.workoutTemplateService.getTemplateById(session.workoutTemplateId);
    const template = templateResult.data as WorkoutTemplate | null;

    return template?.name ?? 'Template Workout';
  }
}
