import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
      <div>
        <p class="text-sm font-semibold text-green-700">Welcome back</p>
        <h2 class="mt-2 text-3xl font-bold">Log in</h2>
        <p class="mt-2 text-sm text-slate-600">Sign in to continue to your fitness dashboard.</p>
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
            autocomplete="current-password"
            class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          @if (showPasswordRequiredError) {
            <span class="mt-1 block text-sm text-red-700">Password is required.</span>
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
        class="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {{ isLoading ? 'Signing in...' : 'Log in' }}
      </button>

      <p class="text-center text-sm text-slate-600">
        No account yet?
        <a routerLink="/register" class="font-semibold text-green-700">Register</a>
      </p>
    </form>
  `,
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  isLoading = false;
  errorMessage = '';

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
