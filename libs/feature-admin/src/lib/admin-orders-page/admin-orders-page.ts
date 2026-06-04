import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdminOrdersStore } from '@restaurant-platform/state';

@Component({
  selector: 'rp-admin-orders-page',
  template: `
    <h1>Admin orders</h1>
    <p>Loaded: {{ adminOrders.ordersEntities().length }}</p>
    <p>Pending: {{ adminOrders.pendingCount() }}</p>
    <p>Preparing: {{ adminOrders.preparingCount() }}</p>
    <p>Ready: {{ adminOrders.readyCount() }}</p>
    <p>SSE: {{ adminOrders.sseConnected() ? 'live' : 'offline' }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersPage {
  protected readonly adminOrders = inject(AdminOrdersStore);
}
