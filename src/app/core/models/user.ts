/** Usuario autenticado. */
export interface User {
  id: string;
  name: string;
  country: string;
  department: string;
  city: string;
}

/** Cuerpo de registro. */
export interface RegisterRequest {
  name: string;
  country: string;
  department: string;
  city: string;
  deviceId?: string;
  platform: string;
}

/** Respuesta de registro. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/** Respuesta de refresh. */
export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string | null;
}
