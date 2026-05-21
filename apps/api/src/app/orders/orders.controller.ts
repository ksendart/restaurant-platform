import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderDto, OrderStreamEvent } from '@restaurant-platform/shared-types';
import { Observable, filter, fromEvent, map } from 'rxjs';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtSseAuthGuard } from '../auth/jwt-sse-auth.guard';
import { AuthenticatedUser } from '../auth/jwt.strategy';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  ORDER_STATUS_CHANGED,
  OrderStatusChangedEvent,
} from './events/order-status-changed.event';
import { OrdersService } from './orders.service';

interface SseMessage<T> {
  data: T;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOrderDto
  ): Promise<OrderDto> {
    return this.ordersService.create(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthenticatedUser): Promise<OrderDto[]> {
    return this.ordersService.findAllForUser(user.id);
  }

  @Sse('stream')
  @UseGuards(JwtSseAuthGuard)
  stream(
    @CurrentUser() user: AuthenticatedUser
  ): Observable<SseMessage<OrderStreamEvent>> {
    return fromEvent<OrderStatusChangedEvent>(
      this.eventEmitter,
      ORDER_STATUS_CHANGED
    ).pipe(
      filter((event) => event.userId === user.id),
      map((event) => ({
        data: { id: event.orderId, status: event.status },
      }))
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ): Promise<OrderDto> {
    return this.ordersService.findOneForUser(id, user.id);
  }

  // TODO(Iter 4): move to admin controller behind RolesGuard('admin').
  // Temporary endpoint for manual SSE testing via curl.
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ): Promise<OrderDto> {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
