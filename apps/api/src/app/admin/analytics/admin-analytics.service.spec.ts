import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import {
  startMongoMemory,
  stopMongoMemory,
} from '../../../test-utils/mongo-memory';
import { Order, OrderSchema } from '../../orders/order.schema';
import { AdminAnalyticsService } from './admin-analytics.service';

interface OrderSeed {
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date;
  items?: Array<{
    dishId: Types.ObjectId;
    name: string;
    price: number;
    count: number;
  }>;
}

const userId = new Types.ObjectId();
const dishMargherita = new Types.ObjectId();
const dishPepperoni = new Types.ObjectId();
const dishHawaiian = new Types.ObjectId();

const defaultItems = [
  { dishId: dishMargherita, name: 'Margherita', price: 500, count: 1 },
];

const baseContact = {
  name: 'Test',
  phone: '+1234567',
  email: 'test@example.com',
};

const seedOrder = (overrides: OrderSeed) => ({
  userId,
  items: overrides.items ?? defaultItems,
  contact: baseContact,
  pickupSlot: '12:00',
  total: overrides.total,
  status: overrides.status,
  createdAt: overrides.createdAt,
});

describe('AdminAnalyticsService', () => {
  let moduleRef: TestingModule;
  let service: AdminAnalyticsService;
  let orderModel: Model<Order>;

  beforeAll(async () => {
    const uri = await startMongoMemory();

    moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
      ],
      providers: [AdminAnalyticsService],
    }).compile();

    service = moduleRef.get(AdminAnalyticsService);
    orderModel = moduleRef.get<Model<Order>>(getModelToken(Order.name));
  });

  afterAll(async () => {
    await moduleRef.close();
    await stopMongoMemory();
  });

  beforeEach(async () => {
    await orderModel.deleteMany({});
  });

  describe('getRevenue', () => {
    it('sums only completed orders, fills empty days, computes totals', async () => {
      await orderModel.insertMany([
        seedOrder({
          total: 1000,
          status: 'completed',
          createdAt: new Date('2026-06-01T10:00:00.000Z'),
        }),
        seedOrder({
          total: 500,
          status: 'completed',
          createdAt: new Date('2026-06-01T20:00:00.000Z'),
        }),
        seedOrder({
          total: 2000,
          status: 'completed',
          createdAt: new Date('2026-06-03T08:00:00.000Z'),
        }),
        seedOrder({
          total: 999,
          status: 'cancelled',
          createdAt: new Date('2026-06-02T10:00:00.000Z'),
        }),
        seedOrder({
          total: 888,
          status: 'pending',
          createdAt: new Date('2026-06-02T10:00:00.000Z'),
        }),
      ]);

      const res = await service.getRevenue({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-04T00:00:00.000Z',
      });

      expect(res.days).toEqual([
        { date: '2026-06-01', revenue: 1500, ordersCount: 2 },
        { date: '2026-06-02', revenue: 0, ordersCount: 0 },
        { date: '2026-06-03', revenue: 2000, ordersCount: 1 },
      ]);
      expect(res.totals.revenue).toBe(3500);
      expect(res.totals.ordersCount).toBe(3);
      expect(res.totals.avgCheck).toBeCloseTo(3500 / 3);
    });

    it('computes conversion as completed / (completed + cancelled)', async () => {
      await orderModel.insertMany([
        seedOrder({
          total: 100,
          status: 'completed',
          createdAt: new Date('2026-06-02T10:00:00.000Z'),
        }),
        seedOrder({
          total: 100,
          status: 'completed',
          createdAt: new Date('2026-06-02T11:00:00.000Z'),
        }),
        seedOrder({
          total: 100,
          status: 'completed',
          createdAt: new Date('2026-06-02T12:00:00.000Z'),
        }),
        seedOrder({
          total: 100,
          status: 'cancelled',
          createdAt: new Date('2026-06-02T13:00:00.000Z'),
        }),
        seedOrder({
          total: 100,
          status: 'pending',
          createdAt: new Date('2026-06-02T14:00:00.000Z'),
        }),
      ]);

      const res = await service.getRevenue({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-04T00:00:00.000Z',
      });

      expect(res.totals.conversionRate).toBeCloseTo(0.75);
    });

    it('returns zero totals when range has no orders', async () => {
      const res = await service.getRevenue({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-03T00:00:00.000Z',
      });

      expect(res.totals).toEqual({
        revenue: 0,
        ordersCount: 0,
        avgCheck: 0,
        conversionRate: 0,
      });
      expect(res.days).toHaveLength(2);
    });

    it('excludes orders outside the [from, to) interval', async () => {
      await orderModel.insertMany([
        seedOrder({
          total: 1000,
          status: 'completed',
          createdAt: new Date('2026-05-31T23:59:59.000Z'),
        }),
        seedOrder({
          total: 1000,
          status: 'completed',
          createdAt: new Date('2026-06-04T00:00:00.000Z'),
        }),
        seedOrder({
          total: 500,
          status: 'completed',
          createdAt: new Date('2026-06-02T12:00:00.000Z'),
        }),
      ]);

      const res = await service.getRevenue({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-04T00:00:00.000Z',
      });

      expect(res.totals.revenue).toBe(500);
      expect(res.totals.ordersCount).toBe(1);
    });
  });

  describe('getTopDishes', () => {
    it('returns count and revenue per dish, sorted by count desc then name asc', async () => {
      await orderModel.insertMany([
        seedOrder({
          total: 1500,
          status: 'completed',
          createdAt: new Date('2026-06-02T10:00:00.000Z'),
          items: [
            {
              dishId: dishMargherita,
              name: 'Margherita',
              price: 500,
              count: 2,
            },
            { dishId: dishPepperoni, name: 'Pepperoni', price: 600, count: 1 },
          ],
        }),
        seedOrder({
          total: 1100,
          status: 'completed',
          createdAt: new Date('2026-06-02T12:00:00.000Z'),
          items: [
            {
              dishId: dishMargherita,
              name: 'Margherita',
              price: 500,
              count: 1,
            },
            { dishId: dishHawaiian, name: 'Hawaiian', price: 700, count: 1 },
          ],
        }),
        seedOrder({
          total: 999,
          status: 'cancelled',
          createdAt: new Date('2026-06-02T13:00:00.000Z'),
          items: [
            {
              dishId: dishMargherita,
              name: 'Margherita',
              price: 500,
              count: 5,
            },
          ],
        }),
      ]);

      const res = await service.getTopDishes({
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-04T00:00:00.000Z',
      });

      expect(res.dishes).toEqual([
        {
          dishId: String(dishMargherita),
          name: 'Margherita',
          count: 3,
          revenue: 1500,
        },
        {
          dishId: String(dishHawaiian),
          name: 'Hawaiian',
          count: 1,
          revenue: 700,
        },
        {
          dishId: String(dishPepperoni),
          name: 'Pepperoni',
          count: 1,
          revenue: 600,
        },
      ]);
    });

    it('respects limit', async () => {
      await orderModel.insertMany([
        seedOrder({
          total: 1800,
          status: 'completed',
          createdAt: new Date('2026-06-02T10:00:00.000Z'),
          items: [
            {
              dishId: dishMargherita,
              name: 'Margherita',
              price: 500,
              count: 3,
            },
            { dishId: dishPepperoni, name: 'Pepperoni', price: 600, count: 2 },
            { dishId: dishHawaiian, name: 'Hawaiian', price: 700, count: 1 },
          ],
        }),
      ]);

      const res = await service.getTopDishes(
        {
          from: '2026-06-01T00:00:00.000Z',
          to: '2026-06-04T00:00:00.000Z',
        },
        2
      );

      expect(res.dishes).toHaveLength(2);
      expect(res.dishes[0].name).toBe('Margherita');
      expect(res.dishes[1].name).toBe('Pepperoni');
    });
  });
});
