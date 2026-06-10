import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-5">
      <div>
        <p class="text-sm font-semibold text-green-700">Welcome</p>
        <h2 class="mt-2 text-3xl font-bold">Dashboard</h2>
        <p class="mt-2 text-sm text-slate-600">
          {{ userEmail || 'Your account is ready.' }}
        </p>
      </div>

      <div class="grid gap-3">
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm text-slate-500">Auth</p>
          <p class="mt-1 font-semibold">Supabase session is active</p>
        </div>
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm text-slate-500">Next step</p>
          <p class="mt-1 font-semibold">Add profile setup after database policies are applied</p>
        </div>
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
        class="inline-flex w-full justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-100"
      >
        {{ isLoading ? 'Logging out...' : 'Log out' }}
      </button>
    </div>
  `,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  userEmail = '';
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.authService.getCurrentUser().then((user) => {
      this.userEmail = user?.email ?? '';
    });
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
}
