import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { OrdersApi } from '@restaurant-platform/data-access-orders';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';
import { UserOrdersStore } from '@restaurant-platform/state';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'not-found' | 'error';

const PROGRESS_STAGES: readonly {
  status: Exclude<OrderStatus, 'cancelled'>;
  label: string;
}[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready for pickup' },
  { status: 'completed', label: 'Completed' },
];

@Component({
  selector: 'rp-order-detail-page',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './order-detail-page.html',
  styleUrl: './order-detail-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPage {
  private readonly store = inject(UserOrdersStore);
  private readonly ordersApi = inject(OrdersApi);

  readonly id = input.required<string>();

  protected readonly stages = PROGRESS_STAGES;
  protected readonly sseConnected = this.store.sseConnected;

  protected readonly loadStatus = signal<LoadStatus>('idle');

  protected readonly order = computed<OrderDto | null>(
    () => this.store.ordersEntityMap()[this.id()] ?? null
  );

  protected readonly currentStageIndex = computed<number>(() => {
    const current = this.order();
    if (!current || current.status === 'cancelled') return -1;
    return PROGRESS_STAGES.findIndex((s) => s.status === current.status);
  });

  constructor() {
    afterNextRender(() => this.ensureLoaded());
  }

  protected retry(): void {
    this.ensureLoaded(true);
  }

  protected shortId(id: string): string {
    return id.slice(-6).toUpperCase();
  }

  private ensureLoaded(force = false): void {
    if (!force && this.order()) {
      this.loadStatus.set('ready');
      return;
    }
    this.loadStatus.set('loading');
    this.ordersApi.getById(this.id()).subscribe({
      next: () => {
        this.store.loadOne(this.id());
        this.loadStatus.set('ready');
      },
      error: (err: unknown) => {
        const status = (err as { status?: number })?.status;
        this.loadStatus.set(
          status === 404 || status === 403 ? 'not-found' : 'error'
        );
      },
    });
  }
}
