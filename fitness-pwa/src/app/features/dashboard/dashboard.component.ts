import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-5">
      <div>
        <p class="text-sm font-semibold text-green-700">Today</p>
        <h2 class="mt-2 text-3xl font-bold">Dashboard</h2>
        <p class="mt-2 text-sm text-slate-600">Workout features will be added after the foundation is stable.</p>
      </div>

      <div class="grid gap-3">
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm text-slate-500">Next step</p>
          <p class="mt-1 font-semibold">Connect auth and profile setup</p>
        </div>
        <div class="rounded-lg border border-slate-200 p-4">
          <p class="text-sm text-slate-500">PWA</p>
          <p class="mt-1 font-semibold">Installable production build configured</p>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {}
