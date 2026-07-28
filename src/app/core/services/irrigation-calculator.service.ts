import { Injectable } from '@angular/core';

import {
  IrrigationCropProfile,
  IrrigationRecommendation,
} from '../models/irrigation';

/**
 * Calculadora de riego local (sin llamadas a la API).
 * Regla: si mañana y tarde ≥ umbral de decisión → «No regar»; si no → «Regar».
 */
@Injectable({ providedIn: 'root' })
export class IrrigationCalculatorService {
  /** Perfiles de cultivo con CC, límite máx. y umbral de decisión. */
  readonly cropProfiles: readonly IrrigationCropProfile[] = [
    {
      name: 'Aguacate',
      fieldCapacity: 39,
      maxIrrigationLimit: 31.2,
      irrigationDecision: 24.96,
    },
    {
      name: 'Cacao',
      fieldCapacity: 34,
      maxIrrigationLimit: 27.2,
      irrigationDecision: 21.76,
    },
    {
      name: 'Lima',
      fieldCapacity: 36,
      maxIrrigationLimit: 28.8,
      irrigationDecision: 23.04,
    },
    {
      name: 'Papaya',
      fieldCapacity: 34,
      maxIrrigationLimit: 27.2,
      irrigationDecision: 21.76,
    },
  ];

  /**
   * Calcula la recomendación de riego a partir de dos lecturas y el umbral.
   * @param morningMoisture Humedad de la mañana (%).
   * @param afternoonMoisture Humedad de la tarde (%).
   * @param irrigationDecision Umbral de decisión (% de CC).
   */
  recommendation(
    morningMoisture: number,
    afternoonMoisture: number,
    irrigationDecision: number
  ): IrrigationRecommendation {
    return morningMoisture >= irrigationDecision &&
      afternoonMoisture >= irrigationDecision
      ? 'No regar'
      : 'Regar';
  }

  /**
   * Busca un perfil de cultivo por nombre.
   * @param name Nombre del cultivo.
   */
  getProfile(name: string): IrrigationCropProfile | undefined {
    return this.cropProfiles.find((c) => c.name === name);
  }

  /**
   * Resuelve el perfil de CC a partir del texto del sensor (nombre o cultivo).
   * @param text Texto libre (p. ej. "Sensor M319-1 – Cacao").
   */
  resolveProfileFromText(text: string): IrrigationCropProfile {
    const normalized = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');

    if (normalized.includes('aguacate')) {
      return this.getProfile('Aguacate')!;
    }
    if (normalized.includes('cacao')) {
      return this.getProfile('Cacao')!;
    }
    if (normalized.includes('papaya')) {
      return this.getProfile('Papaya')!;
    }
    if (normalized.includes('lima') || normalized.includes('tahiti')) {
      return this.getProfile('Lima')!;
    }

    return this.getProfile('Cacao')!;
  }
}
