import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-pending-approval',
  template: `
    <section class="space-y-6">
      <header class="space-y-3">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('brandLabel') }}</p>
        <div>
          <h2 class="text-3xl font-bold leading-tight tracking-tight text-slate-950">
            {{ t('waitingForApproval') }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            {{ t('pendingApprovalDescription') }}
          </p>
        </div>
      </header>

      <section class="app-card space-y-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {{ t('account') }}
          </p>
          <p class="mt-2 text-base font-bold text-slate-950">{{ userEmail || t('notSet') }}</p>
        </div>

        <div class="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-5 text-slate-600">
          {{ t('pendingApprovalAdminNote') }}
        </div>
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
    </section>
  `,
})
export class PendingApprovalComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  userEmail = '';
  isLoading = false;
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    const user = await this.authService.getCurrentUser();
    this.userEmail = user?.email ?? '';
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

  t(key: string): string {
    return this.translationService.translate(key);
  }
}
