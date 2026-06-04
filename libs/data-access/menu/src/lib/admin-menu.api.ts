import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  AdminDishDto,
  CreateDishRequest,
  UpdateDishRequest,
} from '@restaurant-platform/shared-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminMenuApi {
  private readonly http = inject(HttpClient);

  list(): Observable<AdminDishDto[]> {
    return this.http.get<AdminDishDto[]>('/api/admin/menu');
  }

  create(input: CreateDishRequest): Observable<AdminDishDto> {
    return this.http.post<AdminDishDto>('/api/admin/menu', input);
  }

  update(id: string, input: UpdateDishRequest): Observable<AdminDishDto> {
    return this.http.patch<AdminDishDto>(`/api/admin/menu/${id}`, input);
  }

  setArchived(id: string, isArchived: boolean): Observable<AdminDishDto> {
    return this.http.patch<AdminDishDto>(`/api/admin/menu/${id}/archive`, {
      isArchived,
    });
  }
}
