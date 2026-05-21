import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';
import { Dish } from '../menu/dish.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ORDER_STATUS_CHANGED,
  OrderStatusChangedEvent,
} from './events/order-status-changed.event';
import { Order, OrderDocument } from './order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Dish.name) private readonly dishModel: Model<Dish>,
    private readonly eventEmitter: EventEmitter2
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

    const dto2 = toDto(created);
    this.eventEmitter.emit(
      ORDER_STATUS_CHANGED,
      new OrderStatusChangedEvent(dto2.id, userId, dto2.status)
    );
    return dto2;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<OrderDto> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const updated = await this.orderModel
      .findByIdAndUpdate(orderId, { status }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const dto = toDto(updated);
    this.eventEmitter.emit(
      ORDER_STATUS_CHANGED,
      new OrderStatusChangedEvent(dto.id, String(updated.userId), dto.status)
    );
    return dto;
  }

  async findAllForUser(userId: string): Promise<OrderDto[]> {
    const docs = await this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toDto);
  }

  async findOneForUser(orderId: string, userId: string): Promise<OrderDto> {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const doc = await this.orderModel.findById(orderId).exec();
    if (!doc) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (String(doc.userId) !== userId) {
      throw new ForbiddenException();
    }
    return toDto(doc);
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
