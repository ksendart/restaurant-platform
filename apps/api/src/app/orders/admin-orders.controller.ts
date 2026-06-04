import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { OrderDto } from '@restaurant-platform/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(['admin'])
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto
  ): Promise<OrderDto> {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
