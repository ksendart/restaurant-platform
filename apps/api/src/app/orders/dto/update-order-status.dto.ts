import { IsIn } from 'class-validator';
import { ORDER_STATUSES, OrderStatus } from '@restaurant-platform/shared-types';

export class UpdateOrderStatusDto {
  @IsIn([...ORDER_STATUSES])
  status!: OrderStatus;
}
