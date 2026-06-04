import { computed, effect, inject, untracked } from '@angular/core';
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
  addEntity,
  entityConfig,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { AdminOrdersApi } from '@restaurant-platform/data-access-orders';
import {
  AdminSseClient,
  SseStatus,
} from '@restaurant-platform/data-access-sse';
import {
  AdminOrderStreamEvent,
  OrderDto,
  OrderStatus,
} from '@restaurant-platform/shared-types';
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

export type AdminOrdersStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AdminOrdersState {
  status: AdminOrdersStatus;
  lastError: string | null;
  sseConnected: boolean;
}

const initialState: AdminOrdersState = {
  status: 'idle',
  lastError: null,
  sseConnected: false,
};

const SSE_RECONNECT_GRACE_MS = 3_000;
const SSE_URL = '/api/admin/orders/stream';

const orderEntity = entityConfig({
  entity: type<OrderDto>(),
  collection: 'orders',
  selectId: (order) => order.id,
});

export const AdminOrdersStore = signalStore(
  { providedIn: 'root' },
  withDevtools('admin-orders'),
  withState(initialState),
  withEntities(orderEntity),
  withComputed(({ ordersEntities }) => ({
    orders: computed(() => ordersEntities()),
    pendingCount: computed(
      () =>
        ordersEntities().filter((order) => order.status === 'pending').length
    ),
    preparingCount: computed(
      () =>
        ordersEntities().filter((order) => order.status === 'preparing').length
    ),
    readyCount: computed(
      () => ordersEntities().filter((order) => order.status === 'ready').length
    ),
  })),
  withMethods(
    (
      store,
      adminOrdersApi = inject(AdminOrdersApi),
      sseClient = inject(AdminSseClient),
      authStore = inject(AuthStore)
    ) => {
      const loadAll = rxMethod<void>(
        pipe(
          tap(() => patchState(store, { status: 'loading', lastError: null })),
          switchMap(() =>
            adminOrdersApi.list().pipe(
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

      const subscribeToStream = rxMethod<AdminOrderStreamEvent>(
        pipe(
          tap((event) => {
            if (event.type === 'created') {
              patchState(store, addEntity(event.order, orderEntity));
            } else {
              patchState(
                store,
                updateEntity(
                  { id: event.id, changes: { status: event.status } },
                  orderEntity
                )
              );
            }
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
          filter(() => authStore.isAdmin()),
          switchMap(() =>
            authStore.refresh().pipe(
              tap(() => sseClient.connect(SSE_URL)),
              catchError(() => EMPTY)
            )
          )
        )
      );

      function startStream(): void {
        sseClient.connect(SSE_URL);
        subscribeToStream(sseClient.messages$);
        trackConnection(sseClient.status$);
      }

      function stopStream(): void {
        sseClient.disconnect();
        patchState(store, { sseConnected: false });
      }

      function changeStatus(id: string, status: OrderStatus): void {
        const current = store.ordersEntityMap()[id];
        if (!current) {
          return;
        }
        const previousStatus = current.status;
        patchState(
          store,
          updateEntity({ id, changes: { status } }, orderEntity)
        );

        adminOrdersApi
          .updateStatus(id, status)
          .pipe(
            catchError(() => {
              patchState(
                store,
                updateEntity(
                  { id, changes: { status: previousStatus } },
                  orderEntity
                ),
                { lastError: 'Failed to update status' }
              );
              return EMPTY;
            })
          )
          .subscribe();
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
        startStream,
        stopStream,
        changeStatus,
        reset,
      };
    }
  ),
  withHooks({
    onInit(store, authStore = inject(AuthStore)) {
      effect(() => {
        const isAdmin = authStore.isAdmin();
        untracked(() => {
          if (isAdmin) {
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
