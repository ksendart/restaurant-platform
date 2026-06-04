import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AdminOrderStreamEvent,
  ORDER_STATUSES,
  OrderDto,
  OrderStatus,
} from '@restaurant-platform/shared-types';
import { Observable, fromEvent, map, merge } from 'rxjs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtSseAuthGuard } from '../auth/jwt-sse-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ORDER_CREATED, OrderCreatedEvent } from './events/order-created.event';
import {
  ORDER_STATUS_CHANGED,
  OrderStatusChangedEvent,
} from './events/order-status-changed.event';
import { OrdersService } from './orders.service';

interface SseMessage<T> {
  data: T;
}

@Controller('admin/orders')
@Roles(['admin'])
export class AdminOrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  list(@Query('status') status?: string): Promise<OrderDto[]> {
    if (status && !ORDER_STATUSES.includes(status as OrderStatus)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    return this.ordersService.findAll(status as OrderStatus | undefined);
  }

  @Sse('stream')
  @UseGuards(JwtSseAuthGuard, RolesGuard)
  stream(): Observable<SseMessage<AdminOrderStreamEvent>> {
    const created$ = fromEvent<OrderCreatedEvent>(
      this.eventEmitter,
      ORDER_CREATED
    ).pipe(
      map((event) => ({
        data: { type: 'created' as const, order: event.order },
      }))
    );

    const status$ = fromEvent<OrderStatusChangedEvent>(
      this.eventEmitter,
      ORDER_STATUS_CHANGED
    ).pipe(
      map((event) => ({
        data: {
          type: 'status' as const,
          id: event.orderId,
          status: event.status,
        },
      }))
    );

    return merge(created$, status$);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ): Promise<OrderDto> {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
