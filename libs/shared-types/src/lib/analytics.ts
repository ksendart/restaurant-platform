export interface AnalyticsRangeQuery {
  from?: string;
  to?: string;
}

export interface RevenueDayRow {
  date: string;
  revenue: number;
  ordersCount: number;
}

export interface RevenueTotals {
  revenue: number;
  ordersCount: number;
  avgCheck: number;
  conversionRate: number;
}

export interface RevenueResponse {
  from: string;
  to: string;
  days: RevenueDayRow[];
  totals: RevenueTotals;
}

export interface TopDishRow {
  dishId: string;
  name: string;
  count: number;
  revenue: number;
}

export interface TopDishesResponse {
  from: string;
  to: string;
  dishes: TopDishRow[];
}

export const ANALYTICS_MAX_RANGE_DAYS = 90;
export const ANALYTICS_DEFAULT_RANGE_DAYS = 7;
export const TOP_DISHES_DEFAULT_LIMIT = 10;
