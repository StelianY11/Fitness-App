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
    <section class="space-y-6">
      <header class="space-y-3">
        <div class="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-green-800">
          {{ t('brandLabel') }}
        </div>
        <div>
          <p class="text-sm font-semibold text-green-700">{{ t('startStrong') }}</p>
          <h1 class="mt-2 text-3xl font-bold leading-tight text-slate-950">{{ t('register') }}</h1>
          <p class="mt-2 max-w-sm text-sm leading-6 text-slate-600">{{ t('registerDescription') }}</p>
        </div>
      </header>

      <form class="app-card space-y-5" [formGroup]="form" (ngSubmit)="submit()">
        <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-900">
          {{ t('allowlistAccessNote') }}
        </div>

        <div class="space-y-4">
          <label class="block">
            <span class="text-sm font-semibold text-slate-700">{{ t('email') }}</span>
            <input
              id="register-email"
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

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm font-semibold text-slate-700">{{ t('password') }}</span>
              <input
                id="register-password"
                name="password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                class="app-input mt-2"
              />
              @if (showPasswordRequiredError) {
                <span class="mt-2 block text-sm text-red-700">{{ t('passwordRequired') }}</span>
              } @else if (showPasswordLengthError) {
                <span class="mt-2 block text-sm text-red-700">{{ t('passwordMinLength') }}</span>
              }
            </label>

            <label class="block">
              <span class="text-sm font-semibold text-slate-700">{{ t('confirmPassword') }}</span>
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                autocomplete="new-password"
                class="app-input mt-2"
              />
              @if (showConfirmPasswordRequiredError) {
                <span class="mt-2 block text-sm text-red-700">{{ t('confirmPasswordRequired') }}</span>
              } @else if (showPasswordMismatchError) {
                <span class="mt-2 block text-sm text-red-700">{{ t('passwordsDoNotMatch') }}</span>
              }
            </label>
          </div>
        </div>

        @if (errorMessage) {
          <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
            <p class="font-semibold">{{ t('error') }}</p>
            <p class="mt-1">{{ errorMessage }}</p>
          </div>
        }

        @if (successMessage) {
          <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-800">
            {{ successMessage }}
          </div>
        }

        <button
          type="submit"
          [disabled]="form.invalid || isLoading"
          class="app-button app-button-primary"
        >
          {{ isLoading ? t('loading') : t('createAccount') }}
        </button>

        <p class="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
          {{ t('alreadyHaveAccount') }}
          <a routerLink="/login" class="font-bold text-green-700">{{ t('login') }}</a>
        </p>
      </form>
    </section>
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
      this.errorMessage = this.t('passwordsDoNotMatch');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await this.authService.signUp(normalizedEmail, password);

    this.isLoading = false;

    if (error) {
      this.errorMessage = formatRegisterError(error);
      console.error('Register failed:', {
        flow: 'supabase.auth.signUp',
        emailDomain: getEmailDomain(normalizedEmail),
        error: getSafeRegisterErrorContext(error),
      });
      return;
    }

    if (data.session) {
      await this.router.navigateByUrl('/dashboard');
      return;
    }

    this.successMessage = this.t('registerSuccessConfirmation');
  }
}

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;

  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
}

function formatRegisterError(error: unknown): string {
  const context = getSafeRegisterErrorContext(error);
  const details = [
    context.status ? `Status: ${context.status}` : null,
    context.code ? `Code: ${context.code}` : null,
  ].filter(Boolean);

  return details.length > 0
    ? `${context.message} (${details.join(', ')})`
    : context.message;
}

function getSafeRegisterErrorContext(error: unknown): {
  name: string;
  message: string;
  status: number | string | null;
  code: string | null;
} {
  if (!isRecord(error)) {
    return {
      name: 'UnknownError',
      message: 'Unable to create account.',
      status: null,
      code: null,
    };
  }

  return {
    name: typeof error['name'] === 'string' ? error['name'] : 'AuthError',
    message: typeof error['message'] === 'string' ? error['message'] : 'Unable to create account.',
    status: getStringOrNumber(error['status']),
    code: getString(error['code']),
  };
}

function getEmailDomain(email: string): string {
  return email.includes('@') ? email.split('@').pop() ?? 'unknown' : 'unknown';
}

function getStringOrNumber(value: unknown): number | string | null {
  return typeof value === 'number' || typeof value === 'string' ? value : null;
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
