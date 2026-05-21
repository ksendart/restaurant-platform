import { httpResource } from '@angular/common/http';
import { Injectable, Signal } from '@angular/core';
import { DishDto } from '@restaurant-platform/shared-types';

@Injectable({ providedIn: 'root' })
export class MenuService {
  readonly menu = httpResource<DishDto[]>(() => '/api/menu', {
    defaultValue: [],
  });

  dishById(idSignal: Signal<string | null>) {
    return httpResource<DishDto | undefined>(() => {
      const id = idSignal();
      return id ? `/api/menu/${id}` : undefined;
    });
  }
}
