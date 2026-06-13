import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <p class="text-sm font-semibold text-green-700">{{ t('startStrong') }}</p>
        <h2 class="mt-2 text-3xl font-bold">{{ t('register') }}</h2>
        <p class="mt-2 text-sm text-slate-600">{{ t('register') }}</p>
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
            autocomplete="new-password"
            class="app-input mt-2"
          />
          @if (showPasswordRequiredError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('passwordRequired') }}</span>
          } @else if (showPasswordLengthError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('passwordMinLength') }}</span>
          }
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">{{ t('confirmPassword') }}</span>
          <input
            type="password"
            formControlName="confirmPassword"
            autocomplete="new-password"
            class="app-input mt-2"
          />
          @if (showConfirmPasswordRequiredError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('confirmPasswordRequired') }}</span>
          } @else if (showPasswordMismatchError) {
            <span class="mt-1 block text-sm text-red-700">{{ t('passwordsDoNotMatch') }}</span>
          }
        </label>
      </div>

      @if (errorMessage) {
        <p class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {{ errorMessage }}
        </p>
      }

      @if (successMessage) {
        <p class="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {{ successMessage }}
        </p>
      }

      <button
        type="submit"
        [disabled]="form.invalid || isLoading"
        class="app-button app-button-primary"
      >
        {{ isLoading ? t('loading') : t('createAccount') }}
      </button>

      <p class="text-center text-sm text-slate-600">
        {{ t('alreadyHaveAccount') }}
        <a routerLink="/login" class="font-semibold text-green-700">{{ t('login') }}</a>
      </p>
    </form>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly translationService = inject(TranslationService);

  readonly form = this.formBuilder.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordsMatchValidator] },
  );

  isLoading = false;
  errorMessage = '';
  successMessage = '';

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

  get showPasswordLengthError(): boolean {
    const password = this.form.controls.password;
    return password.touched && password.hasError('minlength');
  }

  get showConfirmPasswordRequiredError(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return confirmPassword.touched && confirmPassword.hasError('required');
  }

  get showPasswordMismatchError(): boolean {
    return (
      this.form.controls.confirmPassword.touched &&
      this.form.hasError('passwordMismatch') &&
      !this.form.controls.confirmPassword.hasError('required')
    );
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.isLoading) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, confirmPassword } = this.form.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { data, error } = await this.authService.signUp(email.trim().toLowerCase(), password);

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
      return;
    }

    if (data.session) {
      await this.router.navigateByUrl('/dashboard');
      return;
    }

    this.successMessage = 'Account created. Check your email if confirmation is enabled, then log in.';
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}
