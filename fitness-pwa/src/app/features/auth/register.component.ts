import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  template: `
    <div class="space-y-5">
      <div>
        <p class="text-sm font-semibold text-green-700">Start strong</p>
        <h2 class="mt-2 text-3xl font-bold">Register</h2>
        <p class="mt-2 text-sm text-slate-600">A clean placeholder for the future sign-up form.</p>
      </div>

      <div class="rounded-lg border border-green-200 bg-green-50 p-4">
        <p class="text-sm font-medium text-green-800">Tailwind is active on the main app screen.</p>
      </div>

      <a
        routerLink="/login"
        class="inline-flex w-full justify-center rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800"
      >
        I already have an account
      </a>
    </div>
  `,
})
export class RegisterComponent {}
