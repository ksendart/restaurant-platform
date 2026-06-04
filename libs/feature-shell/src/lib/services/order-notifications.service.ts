import { Injectable, effect, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';
import { UserOrdersStore } from '@restaurant-platform/state';

const SNACK_DURATION_MS = 3_000;

const STATUS_MESSAGES: Partial<
  Record<OrderStatus, (shortId: string) => string>
> = {
  preparing: (id) => `Order #${id} is being prepared`,
  ready: (id) => `Order #${id} is ready for pickup`,
  completed: (id) => `Order #${id} completed. Enjoy!`,
  cancelled: (id) => `Order #${id} was cancelled`,
};

function shortOrderId(id: string): string {
  return id.slice(-6).toUpperCase();
}

@Injectable({ providedIn: 'root' })
export class OrderNotificationsService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly userOrdersStore = inject(UserOrdersStore);
  private readonly previousStatusById = new Map<string, OrderStatus>();
  private readonly queue: string[] = [];
  private isShowing = false;

  constructor() {
    effect(() => {
      const orders: OrderDto[] = this.userOrdersStore.ordersEntities();
      for (const order of orders) {
        const previous = this.previousStatusById.get(order.id);
        this.previousStatusById.set(order.id, order.status);
        if (previous === undefined || previous === order.status) {
          continue;
        }
        const build = STATUS_MESSAGES[order.status];
        if (build) {
          this.enqueue(build(shortOrderId(order.id)));
        }
      }
    });
  }

  private enqueue(message: string): void {
    this.queue.push(message);
    this.showNext();
  }

  private showNext(): void {
    if (this.isShowing) return;
    const message = this.queue.shift();
    if (message === undefined) return;
    this.isShowing = true;
    this.snackBar
      .open(message, 'Dismiss', { duration: SNACK_DURATION_MS })
      .afterDismissed()
      .subscribe(() => {
        this.isShowing = false;
        this.showNext();
      });
  }
}
