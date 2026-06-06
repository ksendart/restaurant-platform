import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  OrderDto,
} from '@restaurant-platform/shared-types';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);

  create(body: CreateOrderRequest): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.apiBase}/api/orders`, body);
  }

  list(): Observable<OrderDto[]> {
    return this.http.get<OrderDto[]>(`${this.apiBase}/api/orders`);
  }

  getById(id: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.apiBase}/api/orders/${id}`);
  }
}
