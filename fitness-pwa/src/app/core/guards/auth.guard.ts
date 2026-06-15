import { Injector, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async (_route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const { AuthService } = await import('../services/auth.service');
  const authService = injector.get(AuthService);
  const session = await authService.getSession();

  if (!session) {
    return router.createUrlTree(['/login']);
  }

  const { ProfileService } = await import('../services/profile.service');
  const profileService = injector.get(ProfileService);
  const profileResult = await profileService.refreshCurrentProfile();

  if (profileResult.error) {
    console.error('Approval profile lookup failed:', profileResult.error);
    return router.createUrlTree(['/pending-approval']);
  }

  const profile = profileResult.data;
  const isPendingRoute = state.url.startsWith('/pending-approval');

  if (!profile || profile.approvalStatus !== 'approved') {
    return isPendingRoute ? true : router.createUrlTree(['/pending-approval']);
  }

  return isPendingRoute ? router.createUrlTree(['/dashboard']) : true;
};
