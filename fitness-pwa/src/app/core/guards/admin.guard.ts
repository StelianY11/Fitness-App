import { Injector, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = async () => {
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
  const profile = profileResult.data;

  if (!profile || profile.approvalStatus !== 'approved') {
    return router.createUrlTree(['/pending-approval']);
  }

  return profile.isAdmin ? true : router.createUrlTree(['/dashboard']);
};
