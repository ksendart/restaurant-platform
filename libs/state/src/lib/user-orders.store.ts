import { Injector, computed, effect, inject, untracked } from '@angular/core';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  entityConfig,
  setAllEntities,
  updateEntity,
  upsertEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';
import { OrdersApi } from '@restaurant-platform/data-access-orders';
import { SseStatus, UserSseClient } from '@restaurant-platform/data-access-sse';
import { OrderDto, OrderStreamEvent } from '@restaurant-platform/shared-types';
import {
  EMPTY,
  catchError,
  debounceTime,
  filter,
  pipe,
  switchMap,
  tap,
} from 'rxjs';
import { AuthStore } from './auth.store';

export type UserOrdersStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UserOrdersState {
  status: UserOrdersStatus;
  lastError: string | null;
  sseConnected: boolean;
}

const initialState: UserOrdersState = {
  status: 'idle',
  lastError: null,
  sseConnected: false,
};

const SSE_RECONNECT_GRACE_MS = 3_000;
const SSE_PATH = '/api/orders/stream';

const orderEntity = entityConfig({
  entity: type<OrderDto>(),
  collection: 'orders',
  selectId: (order) => order.id,
});

export const UserOrdersStore = signalStore(
  { providedIn: 'root' },
  withDevtools('user-orders'),
  withState(initialState),
  withEntities(orderEntity),
  withComputed(({ ordersEntities }) => ({
    orders: computed(() => ordersEntities()),
  })),
  withMethods(
    (
      store,
      ordersApi = inject(OrdersApi),
      sseClient = inject(UserSseClient),
      authStore = inject(AuthStore),
      injector = inject(Injector),
      apiBase = inject(API_BASE_URL)
    ) => {
      const sseUrl = `${apiBase}${SSE_PATH}`;
      const loadAll = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: 'loading', lastError: null })),
          switchMap(() =>
            ordersApi.list().pipe(
              tap((orders) => {
                patchState(store, setAllEntities(orders, orderEntity), {
                  status: 'ready',
                });
              }),
              catchError(() => {
                patchState(store, {
                  status: 'error',
                  lastError: 'Failed to load orders',
                });
                return EMPTY;
              })
            )
          )
        )
      );

      const loadOne = rxMethod<string>(
        pipe(
          switchMap((id) =>
            ordersApi.getById(id).pipe(
              tap((order) => {
                patchState(store, upsertEntity(order, orderEntity));
              }),
              catchError(() => EMPTY)
            )
          )
        )
      );

      const subscribeToStream = rxMethod<OrderStreamEvent>(
        pipe(
          tap((event) => {
            patchState(
              store,
              updateEntity(
                { id: event.id, changes: { status: event.status } },
                orderEntity
              )
            );
          })
        )
      );

      const trackConnection = rxMethod<SseStatus>(
        pipe(
          tap((status) =>
            patchState(store, { sseConnected: status === 'connected' })
          ),
          filter((status) => status === 'disconnected'),
          debounceTime(SSE_RECONNECT_GRACE_MS),
          filter(() => authStore.user() !== null),
          switchMap(() =>
            authStore.refresh().pipe(
              tap(() => sseClient.connect(sseUrl)),
              catchError(() => EMPTY)
            )
          )
        )
      );

      function startStream(): void {
        sseClient.connect(sseUrl);
        subscribeToStream(sseClient.messages$, { injector });
        trackConnection(sseClient.status$, { injector });
      }

      function stopStream(): void {
        sseClient.disconnect();
        patchState(store, { sseConnected: false });
      }

      function reset(): void {
        patchState(
          store,
          setAllEntities([] as OrderDto[], orderEntity),
          initialState
        );
      }

      return {
        loadAll,
        loadOne,
        startStream,
        stopStream,
        reset,
      };
    }
  ),
  withHooks({
    onInit(store, authStore = inject(AuthStore)) {
      effect(() => {
        const user = authStore.user();
        const isAdmin = authStore.isAdmin();
        untracked(() => {
          if (user && !isAdmin) {
            store.loadAll();
            store.startStream();
          } else {
            store.stopStream();
            store.reset();
          }
        });
      });
    },
  })
);
