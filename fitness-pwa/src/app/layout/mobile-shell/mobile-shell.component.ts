import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LiveWorkoutService } from '../../core/services/live-workout.service';

@Component({
  selector: 'app-mobile-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="min-h-dvh bg-slate-50 text-slate-950">
      <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm">
        <header class="border-b border-slate-200 px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-green-700">Fitness Tracker</p>
          <h1 class="mt-1 text-2xl font-bold">Train with intent</h1>
        </header>

        @if (activeWorkout()) {
          <section class="border-b border-green-200 bg-green-50 px-5 py-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-bold text-green-900">Active workout in progress</p>
                <p class="mt-1 text-xs text-green-800">
                  Started {{ formatTime(activeWorkout()?.startedAt) }}
                </p>
              </div>
              <button
                type="button"
                (click)="resumeActiveWorkout()"
                class="shrink-0 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Resume
              </button>
            </div>
          </section>
        }

        <section class="flex-1 px-5 py-6">
          <router-outlet />
        </section>

        <nav class="grid grid-cols-3 border-t border-slate-200 bg-white text-sm font-medium">
          <a
            routerLink="/login"
            routerLinkActive="text-green-700"
            class="px-3 py-4 text-center text-slate-600"
          >
            Login
          </a>
          <a
            routerLink="/register"
            routerLinkActive="text-green-700"
            class="px-3 py-4 text-center text-slate-600"
          >
            Register
          </a>
          <a
            routerLink="/dashboard"
            routerLinkActive="text-green-700"
            class="px-3 py-4 text-center text-slate-600"
          >
            Dashboard
          </a>
        </nav>
      </div>
    </main>
  `,
})
export class MobileShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly liveWorkoutService = inject(LiveWorkoutService);
  private readonly router = inject(Router);

  readonly activeWorkout = this.liveWorkoutService.activeWorkout;

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

  private async refreshActiveWorkout(): Promise<void> {
    const session = await this.authService.getSession();

    if (!session) {
      this.liveWorkoutService.activeWorkout.set(null);
      return;
    }

    await this.liveWorkoutService.refreshActiveWorkout();
  }
}
