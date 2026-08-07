import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CreateMetodoCCPayload, MetodoCC } from '../Models/catalog';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/**
 * Catálogo de métodos para capacidad de campo.
 */
@Injectable({ providedIn: 'root' })
export class MetodoCCService {
  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  async list(): Promise<MetodoCC[]> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.get<MetodoCC[]>('/catalog/metodos-cc', { token })
    );
  }

  async getById(id: number): Promise<MetodoCC> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.get<MetodoCC>(`/catalog/metodos-cc/${id}`, { token })
    );
  }

  async create(payload: CreateMetodoCCPayload): Promise<MetodoCC> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.post<MetodoCC>('/catalog/metodos-cc', payload, token)
    );
  }

  async update(id: number, payload: CreateMetodoCCPayload): Promise<MetodoCC> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.put<MetodoCC>(`/catalog/metodos-cc/${id}`, payload, token)
    );
  }
}
