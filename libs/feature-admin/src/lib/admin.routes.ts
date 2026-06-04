import { Route } from '@angular/router';
import { AdminSseClient } from '@restaurant-platform/data-access-sse';
import { AdminMenuStore, AdminOrdersStore } from '@restaurant-platform/state';
import { AdminLayout } from './admin-layout/admin-layout';
import { canDeactivateMenuFormGuard } from './admin-menu-form/can-deactivate-menu-form.guard';
import { AdminSoundService } from './services/admin-sound.service';

export const adminRoutes: Route[] = [
  {
    path: '',
    component: AdminLayout,
    providers: [
      AdminSseClient,
      AdminOrdersStore,
      AdminMenuStore,
      AdminSoundService,
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'orders',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./admin-orders-page/admin-orders-page').then(
            (m) => m.AdminOrdersPage
          ),
        title: 'Admin orders',
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./admin-menu-page/admin-menu-page').then(
            (m) => m.AdminMenuPage
          ),
        title: 'Admin menu',
      },
      {
        path: 'menu/new',
        loadComponent: () =>
          import('./admin-menu-form/admin-menu-form-page').then(
            (m) => m.AdminMenuFormPage
          ),
        canDeactivate: [canDeactivateMenuFormGuard],
        title: 'New dish',
      },
      {
        path: 'menu/:id/edit',
        loadComponent: () =>
          import('./admin-menu-form/admin-menu-form-page').then(
            (m) => m.AdminMenuFormPage
          ),
        canDeactivate: [canDeactivateMenuFormGuard],
        title: 'Edit dish',
      },
    ],
  },
];
