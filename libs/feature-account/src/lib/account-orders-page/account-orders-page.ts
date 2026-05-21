import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';
import { UserOrdersStore } from '@restaurant-platform/state';

type OrderFilter = 'all' | 'active' | OrderStatus;

interface FilterOption {
  value: OrderFilter;
  label: string;
}

const PAGE_SIZE = 10;
const ACTIVE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'preparing',
  'ready',
]);

const FILTER_OPTIONS: readonly FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

@Component({
  selector: 'rp-account-orders-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  templateUrl: './account-orders-page.html',
  styleUrl: './account-orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountOrdersPage {
  private readonly store = inject(UserOrdersStore);

  protected readonly filterOptions = FILTER_OPTIONS;
  protected readonly pageSize = PAGE_SIZE;

  protected readonly status = this.store.status;
  protected readonly lastError = this.store.lastError;
  protected readonly sseConnected = this.store.sseConnected;

  protected readonly filter = signal<OrderFilter>('all');

  protected readonly filteredOrders = computed<OrderDto[]>(() => {
    const all = this.store.ordersEntities();
    const current = this.filter();
    if (current === 'all') return all;
    if (current === 'active') {
      return all.filter((o) => ACTIVE_STATUSES.has(o.status));
    }
    return all.filter((o) => o.status === current);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredOrders().length / PAGE_SIZE))
  );

  protected readonly currentPage = linkedSignal<OrderFilter, number>({
    source: () => this.filter(),
    computation: () => 1,
  });

  protected readonly pagedOrders = computed<OrderDto[]>(() => {
    const orders = this.filteredOrders();
    const total = this.totalPages();
    const page = Math.min(this.currentPage(), total);
    const start = (page - 1) * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  });

  protected onFilterChange(event: MatChipListboxChange): void {
    if (event.value) {
      this.filter.set(event.value as OrderFilter);
    }
  }

  protected onPage(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
  }

  protected retry(): void {
    this.store.loadAll();
  }

  protected shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  protected itemsSummary(order: OrderDto): string {
    const totalCount = order.items.reduce((sum, i) => sum + i.count, 0);
    if (order.items.length === 1) {
      return `${totalCount} × ${order.items[0].name}`;
    }
    return `${totalCount} items`;
  }
}
