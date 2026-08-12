import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/** Usuario con rol Admin. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  active: boolean;
  registeredAt: string;
}

export interface CreateAdminPayload {
  name: string;
  email: string;
  password: string;
}

/**
 * Gestión de usuarios Admin vía API.
 */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  async list(): Promise<AdminUser[]> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(this.api.get<AdminUser[]>('/admin/admins', { token }));
  }

  async create(payload: CreateAdminPayload): Promise<AdminUser> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(this.api.post<AdminUser>('/admin/admins', payload, token));
  }

  async setActive(id: string, active: boolean): Promise<AdminUser> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.put<AdminUser>(`/admin/admins/${id}/active`, { active }, token)
    );
  }

  async remove(id: string): Promise<void> {
    const token = await this.auth.getAccessToken();
    await firstValueFrom(
      this.api.delete<{ ok: boolean }>(`/admin/admins/${id}`, token)
    );
  }
}
