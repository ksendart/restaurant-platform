import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderDto } from '@restaurant-platform/shared-types';
import { Dish } from '../menu/dish.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument } from './order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDto> {
    const dishIds = dto.items.map((item) => new Types.ObjectId(item.dishId));
    const dishes = await this.dishModel
      .find({ _id: { $in: dishIds }, isArchived: false, isAvailable: true })
      .lean()
      .exec();

    const dishById = new Map(dishes.map((dish) => [String(dish._id), dish]));

    const items = dto.items.map((input) => {
      const dish = dishById.get(input.dishId);
      if (!dish) {
        throw new BadRequestException(`Dish ${input.dishId} is not available`);
      }
      return {
        dishId: new Types.ObjectId(input.dishId),
        name: dish.name,
        price: dish.price,
        count: input.count,
      };
    });

    const total = items.reduce((sum, item) => sum + item.price * item.count, 0);

    const created = await this.orderModel.create({
      userId: new Types.ObjectId(userId),
      items,
      contact: dto.contact,
      pickupSlot: dto.pickupSlot,
      total,
    });

    return toDto(created);
  }
}

function toDto(doc: OrderDocument): OrderDto {
  return {
    id: String(doc._id),
    items: doc.items.map((item) => ({
      dishId: String(item.dishId),
      name: item.name,
      price: item.price,
      count: item.count,
    })),
    contact: {
      name: doc.contact.name,
      phone: doc.contact.phone,
      email: doc.contact.email,
    },
    pickupSlot: doc.pickupSlot,
    total: doc.total,
    status: doc.status,
    createdAt: doc.get('createdAt').toISOString(),
  };
}
