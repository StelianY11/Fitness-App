import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <div>
        <p class="text-sm font-semibold text-green-700">Welcome back</p>
        <h2 class="mt-2 text-3xl font-bold">Log in</h2>
        <p class="mt-2 text-sm text-slate-600">Auth wiring comes next. This screen is a placeholder.</p>
      </div>

      <div class="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p class="text-sm text-slate-700">Supabase Auth foundation is ready for this flow.</p>
      </div>

      <a
        routerLink="/register"
        class="inline-flex w-full justify-center rounded-md bg-green-600 px-4 py-3 text-sm font-semibold text-white"
      >
        Create an account
      </a>
    </div>
  `,
})
export class LoginComponent {}
