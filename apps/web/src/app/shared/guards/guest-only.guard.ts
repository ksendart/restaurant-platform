import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthStore } from '@restaurant-platform/state';

export const guestOnlyGuard: CanMatchFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthorized()) {
    return true;
  }
  return router.createUrlTree([
    authStore.isAdmin() ? '/admin/orders' : '/menu',
  ]);
};
