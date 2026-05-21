import { OrderStatus } from '@restaurant-platform/shared-types';

export const ORDER_STATUS_CHANGED = 'order.status.changed';

export class OrderStatusChangedEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly status: OrderStatus
  ) {}
}
