import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { withStorage } from '@restaurant-platform/state-features';
import { CartItem, DishDto } from '@restaurant-platform/shared-types';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

function toCartItem(dish: DishDto, count: number): CartItem {
  return {
    dishId: dish.id,
    name: dish.name,
    price: dish.price,
    imageUrl: dish.imageUrl,
    count,
  };
}

export const CartStore = signalStore(
  { providedIn: 'root' },
  withDevtools('cart'),
  withState<CartState>(initialState),
  withStorage<CartState>('cart'),
  withComputed(({ items }) => ({
    totalCount: computed(() =>
      items().reduce((sum, item) => sum + item.count, 0)
    ),
    totalPrice: computed(() =>
      items().reduce((sum, item) => sum + item.price * item.count, 0)
    ),
    isEmpty: computed(() => items().length === 0),
  })),
  withMethods((store) => {
    const itemsSignal = computed<CartItem[]>(() => store.items());

    return {
      add(dish: DishDto, count = 1): void {
        const items = itemsSignal();
        const existing = items.find((item) => item.dishId === dish.id);
        const next: CartItem[] = existing
          ? items.map((item) =>
              item.dishId === dish.id
                ? { ...item, count: item.count + count }
                : item
            )
          : [...items, toCartItem(dish, count)];
        patchState(store, { items: next });
      },
      increment(dishId: string): void {
        const next: CartItem[] = itemsSignal().map((item) =>
          item.dishId === dishId ? { ...item, count: item.count + 1 } : item
        );
        patchState(store, { items: next });
      },
      decrement(dishId: string): void {
        const next: CartItem[] = itemsSignal().flatMap((item) => {
          if (item.dishId !== dishId) return [item];
          if (item.count <= 1) return [];
          return [{ ...item, count: item.count - 1 }];
        });
        patchState(store, { items: next });
      },
      remove(dishId: string): void {
        const next: CartItem[] = itemsSignal().filter(
          (item) => item.dishId !== dishId
        );
        patchState(store, { items: next });
      },
      clear(): void {
        patchState(store, { items: [] });
      },
    };
  })
);
