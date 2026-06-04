import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthStore } from '@restaurant-platform/state';

export const adminGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAdmin()) {
    return true;
  }

  const returnUrl = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl },
  });
};
