import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderStatus } from '@restaurant-platform/shared-types';
import { Dish, DishDocument } from '../menu/dish.schema';
import { UsersService } from '../users/users.service';
import { Order } from './order.schema';

const SEED_DAYS = 14;
const ORDERS_PER_DAY_MIN = 2;
const ORDERS_PER_DAY_MAX = 6;
const STATUS_DISTRIBUTION: Array<{ status: OrderStatus; weight: number }> = [
  { status: 'completed', weight: 70 },
  { status: 'cancelled', weight: 10 },
  { status: 'ready', weight: 8 },
  { status: 'preparing', weight: 7 },
  { status: 'pending', weight: 5 },
];

@Injectable()
export class OrderSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrderSeeder.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(Dish.name) private readonly dishModel: Model<DishDocument>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.orderModel.estimatedDocumentCount();
    if (existing > 0) {
      this.logger.log(
        `Orders collection already has ${existing} docs, skipping seed.`
      );
      return;
    }

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL')?.trim();
    if (!adminEmail) {
      this.logger.warn('Orders seed skipped: ADMIN_EMAIL not set');
      return;
    }
    const admin = await this.usersService.findByEmail(adminEmail);
    if (!admin) {
      this.logger.warn(
        `Orders seed skipped: admin user ${adminEmail} not found`
      );
      return;
    }

    const dishes = await this.dishModel
      .find({ isArchived: false })
      .lean()
      .exec();
    if (dishes.length === 0) {
      this.logger.warn('Orders seed skipped: no dishes available');
      return;
    }

    const rng = createSeededRng(0xc0ffee);
    const docs = generateOrders(rng, dishes, String(admin._id));

    await this.orderModel.insertMany(docs);
    this.logger.log(`Seeded ${docs.length} orders across ${SEED_DAYS} days.`);
  }
}

interface OrderDoc {
  userId: Types.ObjectId;
  items: Array<{
    dishId: Types.ObjectId;
    name: string;
    price: number;
    count: number;
  }>;
  contact: { name: string; phone: string; email: string };
  pickupSlot: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

function generateOrders(
  rng: () => number,
  dishes: Array<{
    _id: Types.ObjectId;
    name: string;
    price: number;
  }>,
  userId: string
): OrderDoc[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const userObjectId = new Types.ObjectId(userId);
  const orders: OrderDoc[] = [];

  for (let dayOffset = SEED_DAYS - 1; dayOffset >= 0; dayOffset--) {
    const ordersToday =
      ORDERS_PER_DAY_MIN +
      Math.floor(rng() * (ORDERS_PER_DAY_MAX - ORDERS_PER_DAY_MIN + 1));

    for (let i = 0; i < ordersToday; i++) {
      const itemsCount = 1 + Math.floor(rng() * 3);
      const items: OrderDoc['items'] = [];
      for (let j = 0; j < itemsCount; j++) {
        const dish = dishes[Math.floor(rng() * dishes.length)];
        items.push({
          dishId: new Types.ObjectId(dish._id),
          name: dish.name,
          price: dish.price,
          count: 1 + Math.floor(rng() * 3),
        });
      }
      const total = items.reduce(
        (sum, item) => sum + item.price * item.count,
        0
      );
      const status = pickStatus(rng);
      const createdAt = new Date(today.getTime());
      createdAt.setUTCDate(createdAt.getUTCDate() - dayOffset);
      createdAt.setUTCHours(11 + Math.floor(rng() * 10));
      createdAt.setUTCMinutes(Math.floor(rng() * 60));

      orders.push({
        userId: userObjectId,
        items,
        contact: {
          name: 'Seed Customer',
          phone: '+1234567',
          email: 'seed@example.com',
        },
        pickupSlot: '13:00',
        total,
        status,
        createdAt,
      });
    }
  }

  return orders;
}

function pickStatus(rng: () => number): OrderStatus {
  const totalWeight = STATUS_DISTRIBUTION.reduce(
    (sum, entry) => sum + entry.weight,
    0
  );
  let roll = rng() * totalWeight;
  for (const entry of STATUS_DISTRIBUTION) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.status;
    }
  }
  return STATUS_DISTRIBUTION[0].status;
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}
