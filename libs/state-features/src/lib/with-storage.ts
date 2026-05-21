import { PLATFORM_ID, effect, inject, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  getState,
  patchState,
  signalStoreFeature,
  type,
  withHooks,
} from '@ngrx/signals';

export interface WithStorageOptions<TState extends object> {
  select?: (state: TState) => Partial<TState>;
}

export function withStorage<TState extends object>(
  key: string,
  options: WithStorageOptions<TState> = {}
) {
  const select = options.select ?? ((s: TState) => s);

  return signalStoreFeature(
    { state: type<TState>() },
    withHooks({
      onInit(store) {
        const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
        if (!isBrowser) {
          return;
        }

        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<TState>;
            patchState(store, parsed);
          } catch {
            localStorage.removeItem(key);
          }
        }

        effect(() => {
          const snapshot = select(getState(store));
          untracked(() => {
            localStorage.setItem(key, JSON.stringify(snapshot));
          });
        });
      },
    })
  );
}
