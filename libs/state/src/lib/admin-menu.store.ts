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
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { AdminMenuApi } from '@restaurant-platform/data-access-menu';
import {
  AdminDishDto,
  CreateDishRequest,
  UpdateDishRequest,
} from '@restaurant-platform/shared-types';
import { EMPTY, catchError, tap } from 'rxjs';
import { AuthStore } from './auth.store';

export type AdminMenuStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AdminMenuState {
  status: AdminMenuStatus;
  lastError: string | null;
}

const initialState: AdminMenuState = {
  status: 'idle',
  lastError: null,
};

const dishEntity = entityConfig({
  entity: type<AdminDishDto>(),
  collection: 'dishes',
  selectId: (dish) => dish.id,
});

export const AdminMenuStore = signalStore(
  withDevtools('admin-menu'),
  withState(initialState),
  withEntities(dishEntity),
  withComputed(({ dishesEntities }) => ({
    dishes: computed(() => dishesEntities()),
    activeCount: computed(
      () => dishesEntities().filter((d) => !d.isArchived).length
    ),
    archivedCount: computed(
      () => dishesEntities().filter((d) => d.isArchived).length
    ),
  })),
  withMethods((store, adminMenuApi = inject(AdminMenuApi)) => {
    function loadAll(): void {
      patchState(store, { status: 'loading', lastError: null });
      adminMenuApi
        .list()
        .pipe(
          tap((dishes) => {
            patchState(store, setAllEntities(dishes, dishEntity), {
              status: 'ready',
            });
          }),
          catchError(() => {
            patchState(store, {
              status: 'error',
              lastError: 'Failed to load menu',
            });
            return EMPTY;
          })
        )
        .subscribe();
    }

    function findById(id: string): AdminDishDto | undefined {
      return store.dishesEntityMap()[id];
    }

    function create(input: CreateDishRequest) {
      return adminMenuApi.create(input).pipe(
        tap((dish) => {
          patchState(store, addEntity(dish, dishEntity));
        }),
        catchError((err) => {
          patchState(store, { lastError: 'Failed to create dish' });
          throw err;
        })
      );
    }

    function update(id: string, input: UpdateDishRequest) {
      const previous = store.dishesEntityMap()[id];
      if (previous) {
        patchState(store, updateEntity({ id, changes: input }, dishEntity));
      }
      return adminMenuApi.update(id, input).pipe(
        tap((dish) => {
          patchState(
            store,
            updateEntity({ id: dish.id, changes: dish }, dishEntity)
          );
        }),
        catchError((err) => {
          if (previous) {
            patchState(
              store,
              updateEntity({ id, changes: previous }, dishEntity)
            );
          }
          patchState(store, { lastError: 'Failed to update dish' });
          throw err;
        })
      );
    }

    function setArchived(id: string, isArchived: boolean): void {
      const previous = store.dishesEntityMap()[id];
      if (!previous) {
        return;
      }
      patchState(
        store,
        updateEntity({ id, changes: { isArchived } }, dishEntity)
      );
      adminMenuApi
        .setArchived(id, isArchived)
        .pipe(
          catchError(() => {
            patchState(
              store,
              updateEntity(
                { id, changes: { isArchived: previous.isArchived } },
                dishEntity
              ),
              { lastError: 'Failed to update archive state' }
            );
            return EMPTY;
          })
        )
        .subscribe();
    }

    function reset(): void {
      patchState(
        store,
        setAllEntities([] as AdminDishDto[], dishEntity),
        initialState
      );
    }

    return {
      loadAll,
      findById,
      create,
      update,
      setArchived,
      reset,
    };
  }),
  withHooks({
    onInit(store, authStore = inject(AuthStore)) {
      effect(() => {
        const isAdmin = authStore.isAdmin();
        untracked(() => {
          if (isAdmin) {
            store.loadAll();
          } else {
            store.reset();
          }
        });
      });
    },
  })
);
