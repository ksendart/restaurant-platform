import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { AuthStore } from '@restaurant-platform/state';

const SKIP_SEGMENTS = new Set(['admin', 'auth']);

export const customerOnlyGuard: CanMatchFn = (
  _route,
  segments: UrlSegment[]
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAdmin()) {
    return true;
  }

  if (segments.length > 0 && SKIP_SEGMENTS.has(segments[0].path)) {
    return false;
  }

  return router.createUrlTree(['/admin/orders']);
};
