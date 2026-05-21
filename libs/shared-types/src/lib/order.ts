export const ORDER_STATUSES = [
  'pending',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItemDto {
  dishId: string;
  name: string;
  price: number;
  count: number;
}

export interface OrderContact {
  name: string;
  phone: string;
  email: string;
}

export interface CreateOrderRequest {
  items: OrderItemDto[];
  contact: OrderContact;
  pickupSlot: string;
}

export interface OrderDto {
  id: string;
  items: OrderItemDto[];
  contact: OrderContact;
  pickupSlot: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
