import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  labelKey: string;
  items: WorkoutHistoryItem[];
}

@Component({
  selector: 'app-workout-history',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <header class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('workoutHistory') }}</p>
          <h2 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ t('history') }}</h2>
          <p class="mt-2 text-sm leading-5 text-slate-600">{{ t('trainingTimeline') }}</p>
        </div>

        <a
          routerLink="/dashboard"
          class="app-button app-button-secondary min-h-11 w-auto px-3 py-2"
        >
          {{ t('back') }}
        </a>
      </header>

      @if (historyItems.length > 0) {
        <section class="app-card bg-slate-50 shadow-none">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-bold text-slate-950">{{ t('clearAllHistory') }}</p>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('clearHistoryDescription') }}</p>
            </div>
            <button
              type="button"
              (click)="openClearHistoryModal()"
              [disabled]="isClearing"
              class="app-button app-button-danger min-h-11 w-auto px-3 py-2"
            >
              {{ isClearing ? t('loading') : t('delete') }}
            </button>
          </div>
        </section>
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
            class="app-button app-button-danger mt-4 min-h-11 w-auto px-4 py-2"
          >
            {{ t('retry') }}
          </button>
        </div>
      } @else if (historyItems.length === 0) {
        <div class="app-card bg-slate-50 p-5 text-center shadow-none">
          <p class="font-semibold text-slate-800">{{ t('noHistory') }}</p>
          <p class="mt-1 text-sm text-slate-600">{{ t('workoutHistory') }}</p>
        </div>
      } @else {
        <div class="space-y-6">
          @for (group of groups; track group.labelKey) {
            @if (group.items.length > 0) {
              <section class="space-y-3">
                <h3 class="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  {{ t(group.labelKey) }}
                </h3>

                @for (item of group.items; track item.session.id) {
                  <a
                    [routerLink]="['/history', item.session.id]"
                    class="app-card block space-y-3"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h4 class="text-lg font-bold leading-6 text-slate-950">{{ item.workoutName }}</h4>
                        <p class="mt-1 text-sm leading-5 text-slate-600">
                          {{ formatTime(item.session.startedAt) }} - {{ item.session.finishedAt ? formatTime(item.session.finishedAt) : t('open') }}
                        </p>
                      </div>
                      <span class="app-badge bg-green-100 text-green-800">
                        {{ formatDuration(item.session) }}
                      </span>
                    </div>

                    <div class="grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-sm">
                      <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p class="text-xs font-medium text-slate-500">{{ t('exercises') }}</p>
                        <p class="mt-1 font-bold text-slate-950">{{ item.exerciseCount }}</p>
                      </div>
                      <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
                        <p class="mt-1 font-bold text-slate-950">{{ item.setCount }}</p>
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
              class="app-button app-button-secondary"
            >
              {{ isLoadingMore ? t('loading') : t('loadMore') }}
            </button>
          }
        </div>
      }

      @if (showClearHistoryModal) {
        <div class="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/60 px-4 py-5">
          <div class="app-card max-h-[85vh] w-full overflow-y-auto p-4 sm:max-w-lg">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.16em] text-red-700">{{ t('clearAllHistory') }}</p>
              <h3 class="mt-1 text-xl font-bold leading-7 text-slate-950">{{ t('clearHistoryModalTitle') }}</h3>
              <p class="mt-2 text-sm leading-5 text-slate-600">
                {{ t('clearHistoryModalDescription') }}
              </p>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('workoutHistory') }}</p>
                <p class="mt-1 font-bold text-slate-950">{{ historyItems.length }}</p>
              </div>
              <div class="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p class="text-xs font-medium text-slate-500">{{ t('sets') }}</p>
                <p class="mt-1 font-bold text-slate-950">{{ visibleSetCount }}</p>
              </div>
            </div>

            <label class="mt-4 block">
              <span class="text-sm font-semibold text-slate-700">{{ t('clearHistoryTypeInstruction') }}</span>
              <input
                type="text"
                name="clearHistoryConfirmation"
                [(ngModel)]="clearHistoryConfirmation"
                class="app-input mt-2"
                autocomplete="off"
              />
            </label>

            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                (click)="confirmClearAllHistory()"
                [disabled]="isClearing || clearHistoryConfirmation !== clearHistoryPhrase"
                class="app-button app-button-danger"
              >
                {{ isClearing ? t('loading') : t('clearAllHistory') }}
              </button>
              <button
                type="button"
                (click)="closeClearHistoryModal()"
                [disabled]="isClearing"
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
  showClearHistoryModal = false;
  clearHistoryConfirmation = '';
  readonly clearHistoryPhrase = 'DELETE HISTORY';
  private loadRunId = 0;

  constructor() {
    void this.loadHistory();
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }

  async loadHistory(): Promise<void> {
    const loadId = this.loadRunId + 1;
    this.loadRunId = loadId;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.historyItems = [];
      this.groups = createEmptyGroups();
      this.hasMore = false;
      await this.loadPage(0, loadId);
    } catch (error) {
      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.historyItems = [];
      this.groups = createEmptyGroups();
      this.errorMessage = getErrorMessage(error, 'Unable to load workout history.');
      console.error('Workout history load failed:', error);
    } finally {
      if (!this.isStaleLoad(loadId)) {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    }
  }

  async loadMore(): Promise<void> {
    if (this.isLoadingMore || !this.hasMore) {
      return;
    }

    this.isLoadingMore = true;
    this.errorMessage = '';

    try {
      await this.loadPage(this.historyItems.length, this.loadRunId);
    } catch (error) {
      this.errorMessage = getErrorMessage(error, 'Unable to load more workouts.');
      console.error('Workout history load more failed:', error);
    } finally {
      this.isLoadingMore = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  get visibleSetCount(): number {
    return this.historyItems.reduce((total, item) => total + item.setCount, 0);
  }

  openClearHistoryModal(): void {
    this.clearHistoryConfirmation = '';
    this.showClearHistoryModal = true;
  }

  closeClearHistoryModal(): void {
    if (this.isClearing) {
      return;
    }

    this.showClearHistoryModal = false;
    this.clearHistoryConfirmation = '';
  }

  async confirmClearAllHistory(): Promise<void> {
    if (this.clearHistoryConfirmation !== this.clearHistoryPhrase) {
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
      this.showClearHistoryModal = false;
      this.clearHistoryConfirmation = '';
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
      return this.t('open');
    }

    const minutes = Math.max(
      1,
      Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000),
    );

    return `${minutes} min`;
  }

  private async loadTemplateNames(sessions: WorkoutSession[]): Promise<Record<string, string>> {
    const templateIds = Array.from(
      new Set(sessions.map((session) => session.workoutTemplateId).filter(Boolean)),
    ) as string[];
    const nextTemplateNames: Record<string, string> = { ...this.templateNames };

    await Promise.all(templateIds.map(async (templateId) => {
      const templateResult = await this.workoutTemplateService.getTemplateById(templateId);

      if (templateResult.error) {
        console.error('Workout history template name load error:', {
          templateId,
          error: templateResult.error,
        });
        return;
      }

      const template = templateResult.data as WorkoutTemplate | null;

      if (template) {
        nextTemplateNames[template.id] = template.name;
      }
    }));

    return nextTemplateNames;
  }

  private async loadPage(offset: number, loadId: number): Promise<void> {
    const sessionsResult = await this.liveWorkoutService.getCompletedWorkoutSessions({
      from: offset,
      to: offset + this.pageSize,
    });

    if (sessionsResult.error) {
      throw new Error(sessionsResult.error);
    }

    this.hasMore = sessionsResult.data.length > this.pageSize;
    const sessions = sessionsResult.data.slice(0, this.pageSize);
    const newItems: WorkoutHistoryItem[] = sessions.map((session) => ({
      session,
      workoutName: this.getWorkoutName(session),
      exerciseCount: 0,
      setCount: 0,
    }));

    this.historyItems = [...this.historyItems, ...newItems];
    this.groups = groupHistoryItems(this.historyItems);
    this.isLoading = false;
    this.changeDetectorRef.detectChanges();
    void this.enrichHistoryItems(loadId, sessions);
  }

  private async enrichHistoryItems(loadId: number, sessions: WorkoutSession[]): Promise<void> {
    try {
      const [templateNames, countsBySession] = await Promise.all([
        this.loadTemplateNames(sessions),
        this.loadSessionCounts(sessions),
      ]);

      if (this.isStaleLoad(loadId)) {
        return;
      }

      this.templateNames = templateNames;
      this.historyItems = this.historyItems.map((item) => {
        const counts = countsBySession[item.session.id];

        return {
          ...item,
          workoutName: this.getWorkoutName(item.session),
          exerciseCount: counts?.exerciseCount ?? item.exerciseCount,
          setCount: counts?.setCount ?? item.setCount,
        };
      });
      this.groups = groupHistoryItems(this.historyItems);
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('Workout history secondary data load failed:', error);
    }
  }

  private async loadSessionCounts(
    sessions: WorkoutSession[],
  ): Promise<Record<string, { exerciseCount: number; setCount: number }>> {
    const entries = await Promise.all(sessions.map(async (session) => {
      const exercisesResult = await this.liveWorkoutService.getWorkoutExercises(session.id);

      if (exercisesResult.error) {
        console.error('Workout history exercise count load error:', {
          sessionId: session.id,
          error: exercisesResult.error,
        });
        return [session.id, { exerciseCount: 0, setCount: 0 }] as const;
      }

      const setResults = await Promise.all(
        exercisesResult.data.map((workoutExercise) =>
          this.liveWorkoutService.getWorkoutSets(workoutExercise.id),
        ),
      );

      const setCount = setResults.reduce((total, setsResult, index) => {
        if (setsResult.error) {
          console.error('Workout history set count load error:', {
            workoutExerciseId: exercisesResult.data[index]?.id,
            error: setsResult.error,
          });
          return total;
        }

        return total + setsResult.data.length;
      }, 0);

      return [session.id, {
        exerciseCount: exercisesResult.data.length,
        setCount,
      }] as const;
    }));

    return Object.fromEntries(entries);
  }

  private getWorkoutName(session: WorkoutSession): string {
    return session.workoutTemplateId
      ? this.templateNames[session.workoutTemplateId] ?? this.t('templateWorkout')
      : this.t('workoutSession');
  }

  private isStaleLoad(loadId: number): boolean {
    return this.loadRunId !== loadId;
  }
}

function createEmptyGroups(): WorkoutHistoryGroup[] {
  return [
    { labelKey: 'today', items: [] },
    { labelKey: 'yesterday', items: [] },
    { labelKey: 'earlierThisWeek', items: [] },
    { labelKey: 'older', items: [] },
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
