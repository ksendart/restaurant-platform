import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '@restaurant-platform/shared-types';
import { API_BASE_URL } from '@restaurant-platform/data-access-config';

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiBase}/api/auth/login`,
      body,
      {
        withCredentials: true,
      }
    );
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiBase}/api/auth/register`,
      body,
      {
        withCredentials: true,
      }
    );
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiBase}/api/auth/refresh`,
      {},
      { withCredentials: true }
    );
  }

  logout(accessToken?: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBase}/api/auth/logout`,
      {},
      {
        withCredentials: true,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      }
    );
  }
}
