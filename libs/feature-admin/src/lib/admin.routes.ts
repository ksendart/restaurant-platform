import { Route } from '@angular/router';
import { AdminSseClient } from '@restaurant-platform/data-access-sse';
import { AdminOrdersStore } from '@restaurant-platform/state';
import { AdminLayout } from './admin-layout/admin-layout';
import { AdminSoundService } from './services/admin-sound.service';

export const adminRoutes: Route[] = [
  {
    path: '',
    component: AdminLayout,
    providers: [AdminSseClient, AdminOrdersStore, AdminSoundService],
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
    ],
  },
];
