import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';

import {
  AuthResponse,
  LoginRequest,
  RefreshResponse,
  RegisterRequest,
  User,
} from '../Models/user';
import { ApiService } from './api.service';

const KEY_ACCESS = 'yarqua_access_token';
const KEY_REFRESH = 'yarqua_refresh_token';
const KEY_USER = 'yarqua_user';

/**
 * Autenticación con email y contraseña: registro, login, refresh y persistencia en Preferences.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private currentUser: User | null = null;
  private hydrated = false;

  constructor(private readonly api: ApiService) {}

  /**
   * Registra al usuario en el backend y guarda tokens + perfil localmente.
   */
  async register(
    payload: Omit<RegisterRequest, 'platform'> & { platform?: string }
  ): Promise<AuthResponse> {
    const body: RegisterRequest = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      name: payload.name.trim(),
      country: payload.country,
      department: payload.department,
      city: payload.city,
      platform: payload.platform ?? this.detectPlatform(),
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
    };

    const auth = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/register', body)
    );
    await this.persistSession(auth.accessToken, auth.refreshToken, auth.user);
    return auth;
  }

  /**
   * Inicia sesión con email y contraseña.
   */
  async login(
    payload: Omit<LoginRequest, 'platform'> & { platform?: string }
  ): Promise<AuthResponse> {
    const body: LoginRequest = {
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      platform: payload.platform ?? this.detectPlatform(),
      ...(payload.deviceId ? { deviceId: payload.deviceId } : {}),
    };

    const auth = await firstValueFrom(
      this.api.post<AuthResponse>('/auth/login', body)
    );
    await this.persistSession(auth.accessToken, auth.refreshToken, auth.user);
    return auth;
  }

  /**
   * Renueva el access token usando el refresh token almacenado.
   * @returns `true` si la sesión se renovó; `false` si no había refresh o falló.
   */
  async refresh(): Promise<boolean> {
    await this.ensureHydrated();
    if (!this.refreshToken) {
      return false;
    }
    try {
      const result = await firstValueFrom(
        this.api.post<RefreshResponse>('/auth/refresh', {
          refreshToken: this.refreshToken,
        })
      );
      const nextRefresh = result.refreshToken ?? this.refreshToken;
      await this.persistSession(result.accessToken, nextRefresh, this.currentUser);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Indica si hay una sesión válida (access o refresh token presentes).
   */
  async hasSession(): Promise<boolean> {
    await this.ensureHydrated();
    return !!(this.accessToken || this.refreshToken);
  }

  /**
   * Comprueba sesión y, si es posible, renueva tokens en segundo plano.
   * @returns `true` si el usuario puede entrar al mapa.
   */
  async checkSession(): Promise<boolean> {
    await this.ensureHydrated();
    if (!this.accessToken && !this.refreshToken) {
      return false;
    }
    if (this.refreshToken) {
      const ok = await this.refresh();
      if (ok) {
        return true;
      }
    }
    return !!this.accessToken;
  }

  /**
   * Devuelve el access token actual (tras hidratar Preferences).
   */
  async getAccessToken(): Promise<string | null> {
    await this.ensureHydrated();
    return this.accessToken;
  }

  /**
   * Devuelve el usuario persistido o `null`.
   */
  async getUser(): Promise<User | null> {
    await this.ensureHydrated();
    return this.currentUser;
  }

  /**
   * Indica si el usuario autenticado tiene el rol Admin.
   */
  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    return !!user?.roles?.includes('Admin');
  }

  /**
   * Cierra sesión y limpia Preferences.
   */
  async logout(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.currentUser = null;
    await Preferences.remove({ key: KEY_ACCESS });
    await Preferences.remove({ key: KEY_REFRESH });
    await Preferences.remove({ key: KEY_USER });
  }

  private async persistSession(
    access: string,
    refresh: string,
    user: User | null
  ): Promise<void> {
    this.accessToken = access;
    this.refreshToken = refresh;
    this.currentUser = user;
    this.hydrated = true;
    await Preferences.set({ key: KEY_ACCESS, value: access });
    await Preferences.set({ key: KEY_REFRESH, value: refresh });
    if (user) {
      await Preferences.set({ key: KEY_USER, value: JSON.stringify(user) });
    }
  }

  private async ensureHydrated(): Promise<void> {
    if (this.hydrated) {
      return;
    }
    const [access, refresh, userRaw] = await Promise.all([
      Preferences.get({ key: KEY_ACCESS }),
      Preferences.get({ key: KEY_REFRESH }),
      Preferences.get({ key: KEY_USER }),
    ]);
    this.accessToken = access.value;
    this.refreshToken = refresh.value;
    if (userRaw.value) {
      try {
        this.currentUser = JSON.parse(userRaw.value) as User;
      } catch {
        this.currentUser = null;
      }
    }
    this.hydrated = true;
  }

  private detectPlatform(): string {
    const p = Capacitor.getPlatform();
    if (p === 'android' || p === 'ios' || p === 'web') {
      return p;
    }
    return 'web';
  }
}
