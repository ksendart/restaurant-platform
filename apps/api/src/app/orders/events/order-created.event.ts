import { OrderDto } from '@restaurant-platform/shared-types';

export const ORDER_CREATED = 'order.created';

export class OrderCreatedEvent {
  constructor(public readonly order: OrderDto) {}
}
