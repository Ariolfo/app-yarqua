/** Perfil de cultivo para la calculadora de riego local. */
export interface IrrigationCropProfile {
  name: string;
  fieldCapacity: number;
  maxIrrigationLimit: number;
  irrigationDecision: number;
}

/** Recomendación de riego. */
export type IrrigationRecommendation = 'No regar' | 'Regar';
