import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';
import { WorkoutTemplateService } from '../../core/services/workout-template.service';
import { WorkoutSession, WorkoutTemplate } from '../../shared/models/fitness.models';

interface WorkoutHistoryItem {
  session: WorkoutSession;
  workoutName: string;
  exerciseCount: number;
  setCount: number;
}

interface WorkoutHistoryGroup {
  label: string;
  items: WorkoutHistoryItem[];
}

@Component({
  selector: 'app-workout-history',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('history') }}</p>
          <h2 class="mt-2 text-3xl font-bold">{{ t('history') }}</h2>
          <p class="mt-2 text-sm text-slate-600">{{ t('workoutHistory') }}</p>
        </div>

        <a
          routerLink="/dashboard"
          class="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {{ t('back') }}
        </a>
      </div>

      @if (historyItems.length > 0) {
        <button
          type="button"
          (click)="clearAllHistory()"
          [disabled]="isClearing"
          class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {{ isClearing ? t('loading') : t('clearAllHistory') }}
        </button>
      }

      @if (isLoading) {
        <div class="space-y-3">
          @for (item of loadingCards; track item) {
            <div class="h-32 animate-pulse rounded-lg border border-slate-200 bg-slate-100"></div>
          }
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-red-200 bg-red-50 p-4">
          <p class="font-semibold text-red-800">{{ t('unableToLoadHistory') }}</p>
          <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          <button
            type="button"
            (click)="loadHistory()"
            class="mt-4 inline-flex min-h-11 items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else if (historyItems.length === 0) {
        <div class="rounded-lg border border-slate-200 bg-slate-50 p-5 text-center">
          <p class="font-semibold text-slate-800">{{ t('noHistory') }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ t('workoutHistory') }}</p>
        </div>
      } @else {
        <div class="space-y-6">
          @for (group of groups; track group.label) {
            @if (group.items.length > 0) {
              <section class="space-y-3">
                <h3 class="text-sm font-bold uppercase tracking-wide text-slate-500">
                  {{ group.label }}
                </h3>

                @for (item of group.items; track item.session.id) {
                  <a
                    [routerLink]="['/history', item.session.id]"
                    class="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h4 class="text-lg font-bold text-slate-950">{{ item.workoutName }}</h4>
                        <p class="mt-1 text-sm text-slate-600">
                          {{ formatTime(item.session.startedAt) }} - {{ item.session.finishedAt ? formatTime(item.session.finishedAt) : 'Open' }}
                        </p>
                      </div>
                      <span class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        {{ formatDuration(item.session) }}
                      </span>
                    </div>

                    <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div class="rounded-md bg-slate-50 p-3">
                        <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
                        <p class="mt-1 font-semibold text-slate-950">{{ item.exerciseCount }}</p>
                      </div>
                      <div class="rounded-md bg-slate-50 p-3">
                        <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
                        <p class="mt-1 font-semibold text-slate-950">{{ item.setCount }}</p>
                      </div>
                    </div>
                  </a>
                }
              </section>
            }
          }

          @if (hasMore) {
            <button
              type="button"
              (click)="loadMore()"
              [disabled]="isLoadingMore"
              class="inline-flex min-h-12 w-full items-center justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              {{ isLoadingMore ? t('loading') : t('loadMore') }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class WorkoutHistoryComponent {
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly workoutTemplateService = inject(WorkoutTemplateService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly translationService = inject(TranslationService);

  readonly loadingCards = [1, 2, 3, 4];
  private readonly pageSize = 30;

  historyItems: WorkoutHistoryItem[] = [];
  groups: WorkoutHistoryGroup[] = createEmptyGroups();
  templateNames: Record<string, string> = {};
  isLoading = true;
  isLoadingMore = false;
  isClearing = false;
  hasMore = false;
  errorMessage = '';

  constructor() {
    void this.loadHistory();
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }

  async loadHistory(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.historyItems = [];
      this.groups = createEmptyGroups();
      this.hasMore = false;
      await this.loadPage(0);
    } catch (error) {
      this.historyItems = [];
      this.groups = createEmptyGroups();
      this.errorMessage = getErrorMessage(error, 'Unable to load workout history.');
      console.error('Workout history load failed:', error);
    } finally {
      this.isLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.hasMore) {
      return;
    }

    this.isLoadingMore = true;
    this.errorMessage = '';

    try {
      await this.loadPage(this.historyItems.length);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to load more workouts.');
      console.error('Workout history load more failed:', error);
    } finally {
      this.isLoadingMore = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  async clearAllHistory(): Promise<void> {
    const confirmation = prompt('Type DELETE HISTORY to permanently delete all completed workout history.');

    if (confirmation !== 'DELETE HISTORY') {
      return;
    }

    this.isClearing = true;
    this.errorMessage = '';

    try {
      const result = await this.liveWorkoutService.clearCompletedWorkoutHistory();

      if (result.error) {
        throw new Error(result.error);
      }

      this.historyItems = [];
      this.groups = createEmptyGroups();
      this.hasMore = false;
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to clear workout history.');
      console.error('Workout history clear all failed:', error);
    } finally {
      this.isClearing = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  formatTime(value: string): string {
    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDuration(session: WorkoutSession): string {
    if (!session.finishedAt) {
      return 'Open';
    }

    const minutes = Math.max(
      1,
      Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000),
    );

    return `${minutes} min`;
  }

  private async loadTemplateNames(sessions: WorkoutSession[]): Promise<void> {
    const templateIds = Array.from(
      new Set(sessions.map((session) => session.workoutTemplateId).filter(Boolean)),
    ) as string[];
    const nextTemplateNames: Record<string, string> = { ...this.templateNames };

    for (const templateId of templateIds) {
      const templateResult = await this.workoutTemplateService.getTemplateById(templateId);

      if (templateResult.error) {
        console.error('Workout history template name load error:', {
          templateId,
          error: templateResult.error,
        });
        continue;
      }

      const template = templateResult.data as WorkoutTemplate | null;

      if (template) {
        nextTemplateNames[template.id] = template.name;
      }
    }

    this.templateNames = nextTemplateNames;
  }

  private async loadPage(offset: number): Promise<void> {
    const sessionsResult = await this.liveWorkoutService.getCompletedWorkoutSessions({
      from: offset,
      to: offset + this.pageSize,
    });

    if (sessionsResult.error) {
      throw new Error(sessionsResult.error);
    }

    this.hasMore = sessionsResult.data.length > this.pageSize;
    const sessions = sessionsResult.data.slice(0, this.pageSize);
    await this.loadTemplateNames(sessions);

    const newItems: WorkoutHistoryItem[] = [];

    for (const session of sessions) {
      const exercisesResult = await this.liveWorkoutService.getWorkoutExercises(session.id);

      if (exercisesResult.error) {
        throw new Error(exercisesResult.error);
      }

      let setCount = 0;

      for (const workoutExercise of exercisesResult.data) {
        const setsResult = await this.liveWorkoutService.getWorkoutSets(workoutExercise.id);

        if (setsResult.error) {
          throw new Error(setsResult.error);
        }

        setCount += setsResult.data.length;
      }

      newItems.push({
        session,
        workoutName: this.getWorkoutName(session),
        exerciseCount: exercisesResult.data.length,
        setCount,
      });
    }

    this.historyItems = [...this.historyItems, ...newItems];
    this.groups = groupHistoryItems(this.historyItems);
  }

  private getWorkoutName(session: WorkoutSession): string {
    return session.workoutTemplateId
      ? this.templateNames[session.workoutTemplateId] ?? 'Template Workout'
      : 'Workout';
  }
}

function createEmptyGroups(): WorkoutHistoryGroup[] {
  return [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Earlier This Week', items: [] },
    { label: 'Older', items: [] },
  ];
}

function groupHistoryItems(items: WorkoutHistoryItem[]): WorkoutHistoryGroup[] {
  const groups = createEmptyGroups();
  const today = startOfDay(new Date());
  const yesterday = addDays(today, -1);
  const weekStart = startOfWeek(today);

  for (const item of items) {
    const finishedAt = startOfDay(new Date(item.session.finishedAt ?? item.session.startedAt));

    if (finishedAt.getTime() === today.getTime()) {
      groups[0].items.push(item);
    } else if (finishedAt.getTime() === yesterday.getTime()) {
      groups[1].items.push(item);
    } else if (finishedAt >= weekStart) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  }

  return groups;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfWeek(value: Date): Date {
  const day = value.getDay();
  const diff = day === 0 ? 6 : day - 1;

  return addDays(startOfDay(value), -diff);
}

function addDays(value: Date, days: number): Date {
  const nextDate = new Date(value);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
