import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="space-y-3">
        <div class="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-green-800">
          {{ t('brandLabel') }}
        </div>
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('welcomeBack') }}</p>
          <h1 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ t('login') }}</h1>
          <p class="mt-2 max-w-sm text-sm leading-6 text-slate-600">{{ t('signInDescription') }}</p>
        </div>
      </header>

      <form class="app-card space-y-5" [formGroup]="form" (ngSubmit)="submit()">
        <div class="space-y-4">
          <label class="block">
            <span class="text-sm font-semibold text-slate-700">{{ t('email') }}</span>
            <input
              id="login-email"
              name="email"
              type="email"
              formControlName="email"
              autocomplete="email"
              class="app-input mt-2"
            />
            @if (showEmailRequiredError) {
              <span class="mt-2 block text-sm text-red-700">{{ t('emailRequired') }}</span>
            } @else if (showEmailFormatError) {
              <span class="mt-2 block text-sm text-red-700">{{ t('validEmailRequired') }}</span>
            }
          </label>

          <label class="block">
            <span class="text-sm font-semibold text-slate-700">{{ t('password') }}</span>
            <input
              id="login-password"
              name="password"
              type="password"
              formControlName="password"
              autocomplete="current-password"
              class="app-input mt-2"
            />
            @if (showPasswordRequiredError) {
              <span class="mt-2 block text-sm text-red-700">{{ t('passwordRequired') }}</span>
            }
          </label>
        </div>

        @if (errorMessage) {
          <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            <p class="font-semibold">{{ t('error') }}</p>
            <p class="mt-1">{{ errorMessage }}</p>
          </div>
        }

        <button
          type="submit"
          [disabled]="form.invalid || isLoading"
          class="app-button app-button-primary"
        >
          {{ isLoading ? t('loading') : t('login') }}
        </button>

        <p class="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          {{ t('noAccountYet') }}
          <a routerLink="/register" class="font-bold text-green-700">{{ t('register') }}</a>
        </p>
      </form>
    </section>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';

  t(key: string): string {
    return this.translationService.translate(key);
  }

  get showEmailRequiredError(): boolean {
    const email = this.form.controls.email;
    return email.touched && email.hasError('required');
  }

  get showEmailFormatError(): boolean {
    const email = this.form.controls.email;
    return email.touched && email.hasError('email');
  }

  get showPasswordRequiredError(): boolean {
    const password = this.form.controls.password;
    return password.touched && password.hasError('required');
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.form.getRawValue();
    const { error } = await this.authService.signIn(email.trim().toLowerCase(), password);

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    await this.router.navigateByUrl('/dashboard');
  }
}
