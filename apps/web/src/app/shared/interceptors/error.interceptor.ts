import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from '@restaurant-platform/state';
import { AuthResponse } from '@restaurant-platform/shared-types';

const AUTH_ENDPOINT = '/api/auth/';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      if (req.url.includes(AUTH_ENDPOINT)) {
        return throwError(() => error);
      }
      return authStore.refresh().pipe(
        switchMap((response: AuthResponse) => {
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` },
          });
          return next(retried);
        }),
        catchError((refreshError: unknown) => throwError(() => refreshError))
      );
    })
  );
};
