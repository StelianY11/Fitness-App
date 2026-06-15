import { Component, OnInit, inject } from '@angular/core';
import { ProfileService } from '../../core/services/profile.service';
import { TranslationService } from '../../core/services/translation.service';
import { Profile } from '../../shared/models/fitness.models';

@Component({
  selector: 'app-admin-users',
  template: `
    <section class="space-y-6">
      <header class="space-y-3">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-green-700">{{ t('admin') }}</p>
        <div>
          <h2 class="text-3xl font-bold leading-tight tracking-tight text-slate-950">
            {{ t('userApprovals') }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            {{ t('userApprovalsDescription') }}
          </p>
        </div>
      </header>

      @if (isLoading) {
        <div class="space-y-3">
          <div class="h-28 rounded-lg border border-slate-200 bg-slate-100 animate-pulse"></div>
          <div class="h-28 rounded-lg border border-slate-200 bg-slate-100 animate-pulse"></div>
        </div>
      } @else {
        <section class="app-card flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-slate-500">{{ t('pendingUsers') }}</p>
            <p class="mt-1 text-3xl font-bold text-slate-950">{{ pendingProfiles.length }}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-slate-500">{{ t('approvedUsers') }}</p>
            <p class="mt-1 text-3xl font-bold text-slate-950">{{ approvedProfiles.length }}</p>
          </div>
        </section>

        @if (errorMessage) {
          <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {{ errorMessage }}
          </div>
        }

        <section class="space-y-3">
          <h3 class="app-section-title">{{ t('pendingUsers') }}</h3>

          @if (pendingProfiles.length === 0) {
            <div class="app-card text-center">
              <p class="font-bold text-slate-950">{{ t('noPendingUsers') }}</p>
              <p class="mt-1 text-sm leading-5 text-slate-600">{{ t('noPendingUsersDescription') }}</p>
            </div>
          }

          @for (profile of pendingProfiles; track profile.id) {
            <article class="app-card space-y-4">
              <div>
                <p class="text-base font-bold text-slate-950">{{ profile.email || t('notSet') }}</p>
                <p class="mt-1 text-sm text-slate-600">
                  {{ t('registered') }} {{ formatDate(profile.createdAt) }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  (click)="approve(profile)"
                  [disabled]="processingProfileId === profile.id"
                  class="app-button app-button-primary"
                >
                  {{ processingProfileId === profile.id ? t('loading') : t('approve') }}
                </button>
                <button
                  type="button"
                  (click)="reject(profile)"
                  [disabled]="processingProfileId === profile.id"
                  class="app-button app-button-danger"
                >
                  {{ t('reject') }}
                </button>
              </div>
            </article>
          }
        </section>
      }
    </section>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly translationService = inject(TranslationService);

  pendingProfiles: Profile[] = [];
  approvedProfiles: Profile[] = [];
  processingProfileId = '';
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    void this.loadUsers();
  }

  async approve(profile: Profile): Promise<void> {
    await this.updateApproval(profile, 'approved');
  }

  async reject(profile: Profile): Promise<void> {
    await this.updateApproval(profile, 'rejected');
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  t(key: string): string {
    return this.translationService.translate(key);
  }

  private async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      const [pendingResult, approvedResult] = await Promise.all([
        this.profileService.getPendingProfiles(),
        this.profileService.getApprovedProfiles(),
      ]);

      if (pendingResult.error) {
        throw new Error(pendingResult.error);
      }

      if (approvedResult.error) {
        throw new Error(approvedResult.error);
      }

      this.pendingProfiles = pendingResult.data;
      this.approvedProfiles = approvedResult.data;
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to load users.';
    } finally {
      this.isLoading = false;
    }
  }

  private async updateApproval(profile: Profile, status: 'approved' | 'rejected'): Promise<void> {
    if (this.processingProfileId) {
      return;
    }

    this.processingProfileId = profile.id;
    this.errorMessage = '';

    try {
      const result =
        status === 'approved'
          ? await this.profileService.approveProfile(profile.id)
          : await this.profileService.rejectProfile(profile.id);

      if (result.error) {
        throw new Error(result.error);
      }

      await this.loadUsers();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Unable to update user.';
    } finally {
      this.processingProfileId = '';
    }
  }
}
