import { isPlatformBrowser, Location } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AppSettingsService } from '../../core/services/app-settings.service';
import { TranslationService } from '../../core/services/translation.service';
import type { Session } from '@supabase/supabase-js';
import type { Profile, WorkoutSession } from '../../shared/models/fitness.models';

@Component({
  selector: 'app-mobile-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="min-h-dvh bg-slate-50 text-slate-950">
      <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm">
        <header class="border-b border-slate-200 px-5 py-5">
          <p class="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-green-700">Fitness Tracker</p>
          <h1 class="mt-1.5 text-2xl font-bold leading-tight text-slate-950">{{ t('appTagline') }}</h1>
        </header>

        @if (activeWorkout()) {
          <section class="border-b border-green-200 bg-green-50 px-5 py-3.5">
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
                class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-green-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm"
              >
                {{ t('resume') }}
              </button>
            </div>
          </section>
        }

        <section class="app-route-shell flex-1 px-5 py-6 sm:py-7">
          <router-outlet />
        </section>

        @if (swipeIndicatorVisible()) {
          <div
            class="pointer-events-none fixed left-3 top-1/2 z-[900] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl font-bold text-slate-700 shadow-sm transition-opacity"
            [style.opacity]="swipeProgress()"
            [style.transform]="'translateY(-50%) translateX(' + swipeProgress() * 12 + 'px)'"
          >
            ‹
          </div>
        }

        <nav
          class="grid border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] text-sm font-semibold"
          [style.grid-template-columns]="navGridColumns"
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
              {{ t('workouts') }}
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
            @if (currentProfile()?.isAdmin) {
              <a
                routerLink="/admin/users"
                routerLinkActive="text-green-700"
                class="px-3 py-4 text-center text-slate-600"
              >
                {{ t('admin') }}
              </a>
            }
          }
        </nav>
      </div>
    </main>
  `,
})
export class MobileShellComponent implements OnInit, OnDestroy {
  private readonly injector = inject(Injector);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly translationService = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly platformId = inject(PLATFORM_ID);

  readonly activeWorkout = signal<WorkoutSession | null>(null);
  readonly currentSession = signal<Session | null>(null);
  readonly currentProfile = signal<Profile | null>(null);
  readonly swipeProgress = signal(0);
  readonly swipeIndicatorVisible = signal(false);
  readonly settings = this.appSettingsService.settings;
  private isAuthSynced = false;
  private isActiveWorkoutSynced = false;
  private isProfileSynced = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private isTrackingSwipe = false;
  private removeSwipeListeners: Array<() => void> = [];
  private readonly swipeEdgePx = 32;
  private readonly swipeDistancePx = 85;
  private readonly swipeVerticalToleranceRatio = 1.35;

  ngOnInit(): void {
    this.setupSwipeBackGesture();
    void this.refreshActiveWorkout();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        void this.refreshActiveWorkout();
      });
  }

  ngOnDestroy(): void {
    for (const removeListener of this.removeSwipeListeners) {
      removeListener();
    }

    this.removeSwipeListeners = [];
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

  get navGridColumns(): string {
    if (!this.currentSession()) {
      return 'repeat(2, minmax(0, 1fr))';
    }

    return this.currentProfile()?.isAdmin
      ? 'repeat(5, minmax(0, 1fr))'
      : 'repeat(4, minmax(0, 1fr))';
  }

  private async refreshActiveWorkout(): Promise<void> {
    const { AuthService } = await import('../../core/services/auth.service');
    const authService = this.injector.get(AuthService);
    this.syncAuthState(authService);
    const session = await authService.getSession();

    this.currentSession.set(session);

    if (!session) {
      this.activeWorkout.set(null);
      this.currentProfile.set(null);
      return;
    }

    const { ProfileService } = await import('../../core/services/profile.service');
    const profileService = this.injector.get(ProfileService);
    this.syncProfileState(profileService);
    const profileResult = await profileService.refreshCurrentProfile();

    if (!profileResult.error) {
      this.currentProfile.set(profileResult.data);
    }

    const { LiveWorkoutService } = await import('../../core/services/live-workout.service');
    const liveWorkoutService = this.injector.get(LiveWorkoutService);
    this.syncActiveWorkoutState(liveWorkoutService);
    const result = await liveWorkoutService.refreshActiveWorkout();

    if (!result.error) {
      this.activeWorkout.set(result.data);
    }
  }

  private setupSwipeBackGesture(): void {
    if (!isPlatformBrowser(this.platformId) || !('ontouchstart' in window)) {
      return;
    }

    const touchStart = (event: TouchEvent) => this.handleTouchStart(event);
    const touchMove = (event: TouchEvent) => this.handleTouchMove(event);
    const touchEnd = (event: TouchEvent) => this.handleTouchEnd(event);

    window.addEventListener('touchstart', touchStart, { passive: true });
    window.addEventListener('touchmove', touchMove, { passive: true });
    window.addEventListener('touchend', touchEnd, { passive: true });
    window.addEventListener('touchcancel', touchEnd, { passive: true });

    this.removeSwipeListeners = [
      () => window.removeEventListener('touchstart', touchStart),
      () => window.removeEventListener('touchmove', touchMove),
      () => window.removeEventListener('touchend', touchEnd),
      () => window.removeEventListener('touchcancel', touchEnd),
    ];
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches.item(0);

    if (!touch || event.touches.length !== 1) {
      this.resetSwipeState();
      return;
    }

    if (
      touch.clientX > this.swipeEdgePx ||
      this.isSwipeBackRouteDisabled() ||
      this.shouldIgnoreSwipeTarget(event.target)
    ) {
      this.resetSwipeState();
      return;
    }

    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.isTrackingSwipe = true;
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isTrackingSwipe) {
      return;
    }

    const touch = event.touches.item(0);

    if (!touch) {
      this.resetSwipeState();
      return;
    }

    const distanceX = touch.clientX - this.touchStartX;
    const distanceY = Math.abs(touch.clientY - this.touchStartY);

    if (distanceX <= 0 || distanceY > Math.max(24, distanceX / this.swipeVerticalToleranceRatio)) {
      this.swipeProgress.set(0);
      this.swipeIndicatorVisible.set(false);
      return;
    }

    const progress = Math.min(distanceX / this.swipeDistancePx, 1);
    this.swipeProgress.set(progress);
    this.swipeIndicatorVisible.set(!this.prefersReducedMotion() && progress > 0.18);
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isTrackingSwipe) {
      return;
    }

    const touch = event.changedTouches.item(0);
    const distanceX = touch ? touch.clientX - this.touchStartX : 0;
    const distanceY = touch ? Math.abs(touch.clientY - this.touchStartY) : 0;
    const isValidSwipe =
      distanceX >= this.swipeDistancePx &&
      distanceX > distanceY * this.swipeVerticalToleranceRatio &&
      !this.isSwipeBackRouteDisabled() &&
      !this.shouldIgnoreSwipeTarget(event.target);

    this.resetSwipeState();

    if (isValidSwipe) {
      this.navigateBackFromSwipe();
    }
  }

  private navigateBackFromSwipe(): void {
    if (isPlatformBrowser(this.platformId) && window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigate(['/dashboard']);
  }

  private resetSwipeState(): void {
    this.isTrackingSwipe = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.swipeProgress.set(0);
    this.swipeIndicatorVisible.set(false);
  }

  private isSwipeBackRouteDisabled(): boolean {
    const routePath = this.router.url.split('?')[0].split('#')[0];

    return ['', '/', '/login', '/register', '/dashboard', '/pending-approval'].includes(routePath);
  }

  private shouldIgnoreSwipeTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return true;
    }

    if (
      target.closest(
        'input, textarea, select, button, a, label, [contenteditable="true"], [role="button"], [data-swipe-back-ignore], dialog, [aria-modal="true"], [role="dialog"]',
      )
    ) {
      return true;
    }

    return this.isInsideFixedOverlay(target);
  }

  private isInsideFixedOverlay(target: HTMLElement): boolean {
    let element: HTMLElement | null = target;

    while (element) {
      if (element.classList.contains('fixed') && element.classList.contains('inset-0')) {
        return true;
      }

      element = element.parentElement;
    }

    return false;
  }

  private prefersReducedMotion(): boolean {
    return isPlatformBrowser(this.platformId)
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private syncAuthState(authService: InstanceType<typeof import('../../core/services/auth.service').AuthService>): void {
    if (this.isAuthSynced) {
      return;
    }

    this.isAuthSynced = true;
    effect(() => this.currentSession.set(authService.currentSession()), {
      injector: this.injector,
    });
  }

  private syncActiveWorkoutState(
    liveWorkoutService: InstanceType<typeof import('../../core/services/live-workout.service').LiveWorkoutService>,
  ): void {
    if (this.isActiveWorkoutSynced) {
      return;
    }

    this.isActiveWorkoutSynced = true;
    effect(() => this.activeWorkout.set(liveWorkoutService.activeWorkout()), {
      injector: this.injector,
    });
  }

  private syncProfileState(
    profileService: InstanceType<typeof import('../../core/services/profile.service').ProfileService>,
  ): void {
    if (this.isProfileSynced) {
      return;
    }

    this.isProfileSynced = true;
    effect(() => this.currentProfile.set(profileService.currentProfile()), {
      injector: this.injector,
    });
  }
}
