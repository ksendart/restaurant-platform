import { httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import {
  RevenueResponse,
  TopDishesResponse,
} from '@restaurant-platform/shared-types';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';

export interface AnalyticsRangeInput {
  from: string;
  to: string;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly apiBase = inject(API_BASE_URL);

  revenue(range: Signal<AnalyticsRangeInput | null>) {
    return httpResource<RevenueResponse | undefined>(() => {
      const r = range();
      return r
        ? {
            url: `${this.apiBase}/api/admin/analytics/revenue`,
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
            url: `${this.apiBase}/api/admin/analytics/top-dishes`,
            params: { from: r.from, to: r.to },
          }
        : undefined;
    });
  }
}
