import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  OrderDto,
} from '@restaurant-platform/shared-types';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  create(body: CreateOrderRequest): Observable<OrderDto> {
    return this.http.post<OrderDto>('/api/orders', body);
  }

  list(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>('/api/orders');
  }

  getById(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`/api/orders/${id}`);
  }
}
