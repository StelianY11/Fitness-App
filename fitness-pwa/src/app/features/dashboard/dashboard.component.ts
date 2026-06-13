import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkoutTemplateService } from '../../core/services/workout-template.service';
import { WorkoutSession, WorkoutTemplate } from '../../shared/models/fitness.models';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <div>
        <p class="text-sm font-semibold text-green-700">{{ t('welcome') }}</p>
        <h2 class="mt-2 text-3xl font-bold leading-tight tracking-tight">{{ t('dashboard') }}</h2>
        <p class="mt-2.5 text-sm leading-6 text-slate-600">
          {{ userEmail || 'Your account is ready.' }}
        </p>
      </div>

      @if (activeWorkout) {
        <section class="rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
          <p class="text-sm font-semibold text-green-700">{{ t('activeWorkout') }}</p>
          <h3 class="mt-2 text-2xl font-bold leading-tight text-slate-950">{{ activeWorkoutName }}</h3>
          <div class="mt-4 grid grid-cols-2 gap-2.5 text-sm">
            <div class="rounded-md bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('started') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ formatTime(activeWorkout.startedAt) }}</p>
            </div>
            <div class="rounded-md bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('elapsed') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ formatElapsed(activeWorkout.startedAt) }}</p>
            </div>
            <div class="rounded-md bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ activeWorkoutExerciseCount }}</p>
            </div>
            <div class="rounded-md bg-white p-3">
              <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
              <p class="mt-1 font-semibold text-slate-950">{{ activeWorkoutSetCount }}</p>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              (click)="resumeWorkout()"
              class="min-h-12 rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white"
            >
              {{ t('resumeWorkout') }}
            </button>
            <button
              type="button"
              (click)="cancelActiveWorkout()"
              [disabled]="isCancellingActiveWorkout"
              class="min-h-12 rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {{ isCancellingActiveWorkout ? t('loading') : t('cancelWorkout') }}
            </button>
          </div>
        </section>
      }

      <div class="grid gap-3">
        <a
          routerLink="/exercises"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm"
        >
          {{ t('exerciseLibrary') }}
        </a>

        <a
          routerLink="/templates"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-green-600 bg-white px-4 py-3 text-sm font-semibold text-green-700"
        >
          {{ t('workoutTemplates') }}
        </a>

        <a
          routerLink="/history"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
        >
          {{ t('history') }}
        </a>

        <a
          routerLink="/settings"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
        >
          {{ t('settings') }}
        </a>
      </div>

      @if (errorMessage) {
        <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>
      }

      <button
        type="button"
        (click)="logout()"
        [disabled]="isLoading"
        class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {{ isLoading ? t('loading') : t('logout') }}
      </button>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
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
