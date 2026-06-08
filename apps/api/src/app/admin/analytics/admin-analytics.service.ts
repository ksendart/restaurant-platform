import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AnalyticsRangeQuery,
  RevenueDayRow,
  RevenueResponse,
  RevenueTotals,
  TOP_DISHES_DEFAULT_LIMIT,
  TopDishRow,
  TopDishesResponse,
} from '@restaurant-platform/shared-types';
import { Order } from '../../orders/order.schema';
import { resolveRange } from './range';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface RevenueByDayRow {
  _id: string;
  revenue: number;
  ordersCount: number;
}

interface ConversionBucket {
  _id: 'completed' | 'cancelled';
  count: number;
}

interface TopDishAggregateRow {
  _id: unknown;
  name: string;
  count: number;
  revenue: number;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>
  ) {}

  async getRevenue(query: AnalyticsRangeQuery): Promise<RevenueResponse> {
    const { from, to } = resolveRange(query);

    const [byDay, conversion] = await Promise.all([
      this.orderModel.aggregate<RevenueByDayRow>([
        {
          $match: {
            status: 'completed',
            createdAt: { $gte: from, $lt: to },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
                timezone: 'UTC',
              },
            },
            revenue: { $sum: '$total' },
            ordersCount: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      this.orderModel.aggregate<ConversionBucket>([
        {
          $match: {
            status: { $in: ['completed', 'cancelled'] },
            createdAt: { $gte: from, $lt: to },
          },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const days = fillEmptyDays(from, to, byDay);
    const totals = computeTotals(days, conversion);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      days,
      totals,
    };
  }

  async getTopDishes(
    query: AnalyticsRangeQuery,
    limit: number = TOP_DISHES_DEFAULT_LIMIT
  ): Promise<TopDishesResponse> {
    const { from, to } = resolveRange(query);

    const rows = await this.orderModel.aggregate<TopDishAggregateRow>([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: from, $lt: to },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.dishId',
          name: { $first: '$items.name' },
          count: { $sum: '$items.count' },
          revenue: {
            $sum: { $multiply: ['$items.price', '$items.count'] },
          },
        },
      },
      { $sort: { count: -1, name: 1 } },
      { $limit: limit },
    ]);

    const dishes: TopDishRow[] = rows.map((row) => ({
      dishId: String(row._id),
      name: row.name,
      count: row.count,
      revenue: row.revenue,
    }));

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      dishes,
    };
  }
}

function fillEmptyDays(
  from: Date,
  to: Date,
  rows: RevenueByDayRow[]
): RevenueDayRow[] {
  const byDate = new Map(rows.map((row) => [row._id, row]));
  const days: RevenueDayRow[] = [];

  const cursor = startOfUtcDay(from);
  const end = to.getTime();

  while (cursor.getTime() < end) {
    const date = formatUtcDate(cursor);
    const row = byDate.get(date);
    days.push({
      date,
      revenue: row?.revenue ?? 0,
      ordersCount: row?.ordersCount ?? 0,
    });
    cursor.setTime(cursor.getTime() + MS_PER_DAY);
  }

  return days;
}

function computeTotals(
  days: RevenueDayRow[],
  conversion: ConversionBucket[]
): RevenueTotals {
  const revenue = days.reduce((sum, day) => sum + day.revenue, 0);
  const ordersCount = days.reduce((sum, day) => sum + day.ordersCount, 0);
  const avgCheck = ordersCount > 0 ? revenue / ordersCount : 0;

  const counts = new Map(conversion.map((row) => [row._id, row.count]));
  const completed = counts.get('completed') ?? 0;
  const cancelled = counts.get('cancelled') ?? 0;
  const conversionDenominator = completed + cancelled;
  const conversionRate =
    conversionDenominator > 0 ? completed / conversionDenominator : 0;

  return { revenue, ordersCount, avgCheck, conversionRate };
}

function startOfUtcDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function formatUtcDate(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
