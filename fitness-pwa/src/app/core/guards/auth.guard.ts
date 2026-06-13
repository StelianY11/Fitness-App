import { Injector, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async () => {
  const injector = inject(Injector);
  const router = inject(Router);
  const { AuthService } = await import('../services/auth.service');
  const authService = injector.get(AuthService);
  const session = await authService.getSession();

  return session ? true : router.createUrlTree(['/login']);
};
