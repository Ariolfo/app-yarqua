import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  CatalogSensor,
  CreateCatalogSensorPayload,
  Network,
} from '../Models/catalog';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/**
 * Catálogo de sensores / redes desde la API.
 */
@Injectable({ providedIn: 'root' })
export class CatalogSensorService {
  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  async listSensors(): Promise<CatalogSensor[]> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.get<CatalogSensor[]>('/catalog/sensors', { token })
    );
  }

  async getById(id: number): Promise<CatalogSensor> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.get<CatalogSensor>(`/catalog/sensors/${id}`, { token })
    );
  }

  async listNetworks(): Promise<Network[]> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.get<Network[]>('/catalog/networks', { token })
    );
  }

  async create(payload: CreateCatalogSensorPayload): Promise<CatalogSensor> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.post<CatalogSensor>('/catalog/sensors', payload, token)
    );
  }

  async update(
    id: number,
    payload: CreateCatalogSensorPayload
  ): Promise<CatalogSensor> {
    const token = await this.auth.getAccessToken();
    return firstValueFrom(
      this.api.put<CatalogSensor>(`/catalog/sensors/${id}`, payload, token)
    );
  }
}
