import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dish, DishSchema } from '../menu/dish.schema';
import { UsersModule } from '../users/users.module';
import { AdminOrdersController } from './admin-orders.controller';
import { Order, OrderSchema } from './order.schema';
import { OrderSeeder } from './order.seeder';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Dish.name, schema: DishSchema },
    ]),
    UsersModule,
  ],
  controllers: [OrdersController, AdminOrdersController],
  providers: [OrdersService, OrderSeeder],
})
export class OrdersModule {}
