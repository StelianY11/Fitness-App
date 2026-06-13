import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'workout/live/:sessionId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'workout/summary/:sessionId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'history/:sessionId',
    renderMode: RenderMode.Client,
  },
  {
    path: 'templates/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
