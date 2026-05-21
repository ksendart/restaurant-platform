import { Route } from '@angular/router';
import { AuthLayout, MainLayout } from '@restaurant-platform/feature-shell';
import { authGuard } from './shared/guards/auth.guard';

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
        loadComponent: () =>
          import('@restaurant-platform/feature-checkout').then(
            (m) => m.CheckoutPage
          ),
        title: 'Checkout',
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
