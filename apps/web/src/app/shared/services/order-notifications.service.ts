import { Injectable, effect, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';
import { UserOrdersStore } from '@restaurant-platform/state';

const SNACK_DURATION_MS = 5_000;

const STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  preparing: 'Your order is being prepared',
  ready: 'Your order is ready for pickup',
  completed: 'Order completed. Enjoy!',
  cancelled: 'Your order was cancelled',
};

@Injectable({ providedIn: 'root' })
export class OrderNotificationsService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly userOrdersStore = inject(UserOrdersStore);
  private readonly previousStatusById = new Map<string, OrderStatus>();

  constructor() {
    effect(() => {
      const orders: OrderDto[] = this.userOrdersStore.ordersEntities();
      for (const order of orders) {
        const previous = this.previousStatusById.get(order.id);
        this.previousStatusById.set(order.id, order.status);
        if (previous === undefined || previous === order.status) {
          continue;
        }
        const message = STATUS_MESSAGES[order.status];
        if (message) {
          this.snackBar.open(message, 'Dismiss', {
            duration: SNACK_DURATION_MS,
          });
        }
      }
    });
  }
}
