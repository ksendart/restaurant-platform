import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ORDER_STATUSES,
  OrderDto,
  OrderStatus,
} from '@restaurant-platform/shared-types';
import { AdminOrdersStore } from '@restaurant-platform/state';

type AdminFilter = OrderStatus | 'all';

interface StatusAction {
  next: OrderStatus;
  label: string;
}

const STATUS_TRANSITIONS: Record<OrderStatus, StatusAction[]> = {
  pending: [
    { next: 'preparing', label: 'Start preparing' },
    { next: 'cancelled', label: 'Cancel' },
  ],
  preparing: [
    { next: 'ready', label: 'Mark ready' },
    { next: 'cancelled', label: 'Cancel' },
  ],
  ready: [{ next: 'completed', label: 'Complete' }],
  completed: [],
  cancelled: [],
};

@Component({
  selector: 'rp-admin-orders-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './admin-orders-page.html',
  styleUrl: './admin-orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrdersPage {
  protected readonly adminOrders = inject(AdminOrdersStore);
  protected readonly statuses = ORDER_STATUSES;
  protected readonly filter = signal<AdminFilter>('all');

  protected readonly filteredOrders = computed<OrderDto[]>(() => {
    const current = this.filter();
    const all = this.adminOrders.ordersEntities();
    const filtered =
      current === 'all' ? all : all.filter((order) => order.status === current);
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  protected setFilter(value: AdminFilter): void {
    this.filter.set(value);
  }

  protected countFor(status: OrderStatus): number {
    return this.adminOrders.countsByStatus()[status];
  }

  protected actionsFor(status: OrderStatus): StatusAction[] {
    return STATUS_TRANSITIONS[status];
  }

  protected changeStatus(id: string, status: OrderStatus): void {
    this.adminOrders.changeStatus(id, status);
  }

  protected retry(): void {
    this.adminOrders.loadAll();
  }

  protected shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }
}
