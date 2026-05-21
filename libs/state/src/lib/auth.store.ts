import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { AuthApi } from '@restaurant-platform/data-access-auth';
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterRequest,
} from '@restaurant-platform/shared-types';
import {
  EMPTY,
  Observable,
  catchError,
  filter,
  finalize,
  firstValueFrom,
  of,
  pipe,
  shareReplay,
  switchMap,
  tap,
  timer,
} from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: 'idle',
};

const REFRESH_LEAD_MS = 60_000;

interface JwtPayloadWithExp {
  exp?: number;
}

function readExpiryMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1])) as JwtPayloadWithExp;
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withDevtools('auth'),
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthorized: computed(() => user() !== null),
    isAdmin: computed(() => user()?.role === 'admin'),
  })),
  withMethods((store, authApi = inject(AuthApi)) => {
    let refreshInFlight: Observable<AuthResponse> | null = null;

    function applySuccess(response: AuthResponse): void {
      patchState(store, {
        user: response.user,
        accessToken: response.accessToken,
        status: 'authenticated',
      });
    }

    function applyGuest(): void {
      patchState(store, {
        user: null,
        accessToken: null,
        status: 'guest',
      });
    }

    function refresh(): Observable<AuthResponse> {
      if (refreshInFlight) {
        return refreshInFlight;
      }
      refreshInFlight = authApi.refresh().pipe(
        tap((response) => applySuccess(response)),
        catchError((err) => {
          applyGuest();
          throw err;
        }),
        finalize(() => {
          refreshInFlight = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
      return refreshInFlight;
    }

    const login = rxMethod<LoginRequest>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap((body) =>
          authApi.login(body).pipe(
            tap((response) => applySuccess(response)),
            catchError(() => {
              applyGuest();
              return EMPTY;
            })
          )
        )
      )
    );

    const register = rxMethod<RegisterRequest>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        switchMap((body) =>
          authApi.register(body).pipe(
            tap((response) => applySuccess(response)),
            catchError(() => {
              applyGuest();
              return EMPTY;
            })
          )
        )
      )
    );

    const logout = rxMethod<void>(
      pipe(
        switchMap(() =>
          authApi.logout().pipe(
            catchError(() => of(void 0)),
            tap(() => applyGuest())
          )
        )
      )
    );

    async function tryRestoreSession(): Promise<void> {
      patchState(store, { status: 'loading' });
      try {
        await firstValueFrom(refresh());
      } catch {
        // already marked guest in refresh() catchError
      }
    }

    return {
      login,
      register,
      logout,
      refresh,
      tryRestoreSession,
    };
  }),
  withHooks({
    onInit(store) {
      const scheduleRefresh = rxMethod<string | null>(
        pipe(
          switchMap((token) => {
            if (!token) return EMPTY;
            const expiry = readExpiryMs(token);
            if (expiry === null) return EMPTY;
            const delay = expiry - Date.now() - REFRESH_LEAD_MS;
            if (delay <= 0) {
              return of(null);
            }
            return timer(delay);
          }),
          filter(() => store.accessToken() !== null),
          switchMap(() => store.refresh().pipe(catchError(() => EMPTY)))
        )
      );
      scheduleRefresh(toObservable(store.accessToken));
    },
  })
);
