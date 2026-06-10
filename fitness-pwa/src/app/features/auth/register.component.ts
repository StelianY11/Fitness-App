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

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <p class="text-sm font-semibold text-green-700">Start strong</p>
        <h2 class="mt-2 text-3xl font-bold">Register</h2>
        <p class="mt-2 text-sm text-slate-600">Create your account with Supabase Auth.</p>
      </div>

      <div class="space-y-4">
        <label class="block">
          <span class="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            formControlName="email"
            autocomplete="email"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          @if (showEmailRequiredError) {
            <span class="mt-1 block text-sm text-red-700">Email is required.</span>
          } @else if (showEmailFormatError) {
            <span class="mt-1 block text-sm text-red-700">Enter a valid email address.</span>
          }
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            formControlName="password"
            autocomplete="new-password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          @if (showPasswordRequiredError) {
            <span class="mt-1 block text-sm text-red-700">Password is required.</span>
          } @else if (showPasswordLengthError) {
            <span class="mt-1 block text-sm text-red-700">Password must be at least 6 characters.</span>
          }
        </label>

        <label class="block">
          <span class="text-sm font-medium text-slate-700">Confirm password</span>
          <input
            type="password"
            formControlName="confirmPassword"
            autocomplete="new-password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          @if (showConfirmPasswordRequiredError) {
            <span class="mt-1 block text-sm text-red-700">Confirm your password.</span>
          } @else if (showPasswordMismatchError) {
            <span class="mt-1 block text-sm text-red-700">Passwords do not match.</span>
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
        class="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {{ isLoading ? 'Creating account...' : 'Create account' }}
      </button>

      <p class="text-center text-sm text-slate-600">
        Already have an account?
        <a routerLink="/login" class="font-semibold text-green-700">Log in</a>
      </p>
    </form>
  `,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

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
