import { Route } from '@angular/router';

export const appRoutes: Route[] = [
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
    path: 'auth/login',
    loadComponent: () =>
      import('@restaurant-platform/feature-auth').then((m) => m.LoginPage),
    title: 'Sign in',
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('@restaurant-platform/feature-auth').then((m) => m.RegisterPage),
    title: 'Create account',
  },
];
