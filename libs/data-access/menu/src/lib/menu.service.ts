import { httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { DishDto } from '@restaurant-platform/shared-types';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly apiBase = inject(API_BASE_URL);

  readonly menu = httpResource<DishDto[]>(() => `${this.apiBase}/api/menu`, {
    defaultValue: [],
  });

  dishById(idSignal: Signal<string | null>) {
    return httpResource<DishDto | undefined>(() => {
      const id = idSignal();
      return id ? `${this.apiBase}/api/menu/${id}` : undefined;
    });
  }
}
