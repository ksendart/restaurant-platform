import { Route } from '@angular/router';
import { AuthLayout, MainLayout } from '@restaurant-platform/feature-shell';
import { authGuard } from './shared/guards/auth.guard';
import { canDeactivateGuard } from './shared/guards/can-deactivate.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'menu',
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('@restaurant-platform/feature-menu').then((m) => m.MenuPage),
        title: 'Menu',
      },
      {
        path: 'checkout',
        canActivate: [authGuard],
        canDeactivate: [canDeactivateGuard],
        loadComponent: () =>
          import('@restaurant-platform/feature-checkout').then(
            (m) => m.CheckoutPage
          ),
        title: 'Checkout',
      },
      {
        path: 'account/orders',
        canActivate: [authGuard],
        loadComponent: () =>
          import('@restaurant-platform/feature-account').then(
            (m) => m.AccountOrdersPage
          ),
        title: 'My orders',
      },
      {
        path: 'account/orders/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('@restaurant-platform/feature-account').then(
            (m) => m.OrderDetailPage
          ),
        title: 'Order',
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('@restaurant-platform/feature-auth').then((m) => m.LoginPage),
        title: 'Sign in',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@restaurant-platform/feature-auth').then(
            (m) => m.RegisterPage
          ),
        title: 'Create account',
      },
    ],
  },
];
