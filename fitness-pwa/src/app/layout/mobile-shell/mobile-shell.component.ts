import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-mobile-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="min-h-dvh bg-slate-50 text-slate-950">
      <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm">
        <header class="border-b border-slate-200 px-5 py-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-green-700">Fitness Tracker</p>
          <h1 class="mt-1 text-2xl font-bold">Train with intent</h1>
        </header>

        <section class="flex-1 px-5 py-6">
          <router-outlet />
        </section>

        <nav class="grid grid-cols-3 border-t border-slate-200 bg-white text-sm font-medium">
          <a
            routerLink="/login"
            routerLinkActive="text-green-700"
            class="px-3 py-4 text-center text-slate-600"
          >
            Login
          </a>
          <a
            routerLink="/register"
            routerLinkActive="text-green-700"
            class="px-3 py-4 text-center text-slate-600"
          >
            Register
          </a>
          <a
            routerLink="/dashboard"
            routerLinkActive="text-green-700"
            class="px-3 py-4 text-center text-slate-600"
          >
            Dashboard
          </a>
        </nav>
      </div>
    </main>
  `,
})
export class MobileShellComponent {}
