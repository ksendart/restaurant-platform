import { httpResource } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import {
  RevenueResponse,
  TopDishesResponse,
} from '@restaurant-platform/shared-types';

export interface AnalyticsRangeInput {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  revenue(range: Signal<AnalyticsRangeInput | null>) {
    return httpResource<RevenueResponse | undefined>(() => {
      const r = range();
      return r
        ? {
            url: '/api/admin/analytics/revenue',
            params: { from: r.from, to: r.to },
          }
        : undefined;
    });
  }

  topDishes(range: Signal<AnalyticsRangeInput | null>) {
    return httpResource<TopDishesResponse | undefined>(() => {
      const r = range();
      return r
        ? {
            url: '/api/admin/analytics/top-dishes',
            params: { from: r.from, to: r.to },
          }
        : undefined;
    });
  }
}
