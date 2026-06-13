import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'exercises',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/exercises/exercise-library.component').then(
        (m) => m.ExerciseLibraryComponent,
      ),
  },
  {
    path: 'exercises/:exerciseId/history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/exercises/exercise-history.component').then(
        (m) => m.ExerciseHistoryComponent,
      ),
  },
  {
    path: 'workout/live/:sessionId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/live-workout.component').then(
        (m) => m.LiveWorkoutComponent,
      ),
  },
  {
    path: 'workout/summary/:sessionId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/workout-summary.component').then(
        (m) => m.WorkoutSummaryComponent,
      ),
  },
  {
    path: 'history/:sessionId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/workout-detail.component').then(
        (m) => m.WorkoutDetailComponent,
      ),
  },
  {
    path: 'history',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/workout-history.component').then(
        (m) => m.WorkoutHistoryComponent,
      ),
  },
  {
    path: 'templates/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/templates/template-editor.component').then(
        (m) => m.TemplateEditorComponent,
      ),
  },
  {
    path: 'templates',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/workouts/templates/workout-templates.component').then(
        (m) => m.WorkoutTemplatesComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
