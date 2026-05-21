import { UserRole } from './user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
