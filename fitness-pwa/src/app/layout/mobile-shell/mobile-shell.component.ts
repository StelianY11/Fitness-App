import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-mobile-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="min-h-dvh bg-slate-50 text-slate-950">
      <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm">
        <header class="border-b border-slate-200 px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-green-700">Fitness Tracker</p>
          <h1 class="mt-1 text-2xl font-bold">{{ t('appTagline') }}</h1>
        </header>

        @if (activeWorkout()) {
          <section class="border-b border-green-200 bg-green-50 px-5 py-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-green-900">{{ t('activeWorkout') }}</p>
                <p class="mt-1 text-xs text-green-800">
                  {{ t('started') }} {{ formatTime(activeWorkout()?.startedAt) }}
                </p>
              </div>
              <button
                type="button"
                (click)="resumeActiveWorkout()"
                class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white"
              >
                {{ t('resume') }}
              </button>
            </div>
          </section>
        }

        <section class="flex-1 px-5 py-6">
          <router-outlet />
        </section>

        <nav
          class="grid border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] text-sm font-medium"
          [class.grid-cols-2]="!currentSession()"
          [class.grid-cols-4]="currentSession()"
        >
          @if (!currentSession()) {
            <a
              routerLink="/login"
              routerLinkActive="text-green-700"
              class="px-3 py-4 text-center text-slate-600"
            >
              {{ t('login') }}
            </a>
            <a
              routerLink="/register"
              routerLinkActive="text-green-700"
              class="px-3 py-4 text-center text-slate-600"
            >
              {{ t('register') }}
            </a>
          } @else {
            <a
              routerLink="/dashboard"
              routerLinkActive="text-green-700"
              class="px-3 py-4 text-center text-slate-600"
            >
              {{ t('dashboard') }}
            </a>
            <a
              routerLink="/templates"
              routerLinkActive="text-green-700"
              class="px-3 py-4 text-center text-slate-600"
            >
              {{ t('templates') }}
            </a>
            <a
              routerLink="/history"
              routerLinkActive="text-green-700"
              class="px-3 py-4 text-center text-slate-600"
            >
              {{ t('history') }}
            </a>
            <a
              routerLink="/settings"
              routerLinkActive="text-green-700"
              class="px-3 py-4 text-center text-slate-600"
            >
              {{ t('settings') }}
            </a>
          }
        </nav>
      </div>
    </main>
  `,
})
export class MobileShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly translationService = inject(TranslationService);
  private readonly router = inject(Router);

  readonly activeWorkout = this.liveWorkoutService.activeWorkout;
  readonly currentSession = this.authService.currentSession;
  readonly settings = this.appSettingsService.settings;

  ngOnInit(): void {
    void this.refreshActiveWorkout();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        void this.refreshActiveWorkout();
      });
  }

  async resumeActiveWorkout(): Promise<void> {
    const activeWorkout = this.activeWorkout();

    if (!activeWorkout) {
      return;
    }

    await this.router.navigate(['/workout/live', activeWorkout.id]);
  }

  formatTime(value: string | undefined): string {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  t(key: Parameters<TranslationService['translate']>[0]): string {
    return this.translationService.translate(key);
  }

  private async refreshActiveWorkout(): Promise<void> {
    const session = await this.authService.getSession();

    if (!session) {
      this.liveWorkoutService.activeWorkout.set(null);
      return;
    }

    await this.liveWorkoutService.refreshActiveWorkout();
  }
}
