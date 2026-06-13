import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <p class="text-sm font-semibold text-green-700">{{ t('welcomeBack') }}</p>
        <h2 class="mt-2 text-3xl font-bold">{{ t('login') }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ t('signInDescription') }}</p>
      </div>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">{{ t('email') }}</span>
          <input
            type="email"
            formControlName="email"
            autocomplete="email"
            class="app-input mt-2"
          />
          @if (showEmailRequiredError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('emailRequired') }}</span>
          } @else if (showEmailFormatError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('validEmailRequired') }}</span>
          }
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">{{ t('password') }}</span>
          <input
            type="password"
            formControlName="password"
            autocomplete="current-password"
            class="app-input mt-2"
          />
          @if (showPasswordRequiredError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('passwordRequired') }}</span>
          }
        </label>
      </div>

      @if (errorMessage) {
        <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>
      }

      <button
        type="submit"
        [disabled]="form.invalid || isLoading"
        class="app-button app-button-primary"
      >
        {{ isLoading ? t('loading') : t('login') }}
      </button>

      <p class="text-center text-sm text-slate-600">
        {{ t('noAccountYet') }}
        <a routerLink="/register" class="font-semibold text-green-700">{{ t('register') }}</a>
      </p>
    </form>
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
