import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderDto, OrderStatus } from '@restaurant-platform/shared-types';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';

@Injectable({ providedIn: 'root' })
export class AdminOrdersApi {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);

  list(status?: OrderStatus): Observable<OrderDto[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<OrderDto[]>(`${this.apiBase}/api/admin/orders`, {
      params,
    });
  }

  updateStatus(id: string, status: OrderStatus): Observable<OrderDto> {
    return this.http.patch<OrderDto>(
      `${this.apiBase}/api/admin/orders/${id}/status`,
      {
        status,
      }
    );
  }
}
