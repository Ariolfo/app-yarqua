/** Lectura de humedad por canal (sensor_1 / sensor_2). */
export interface Reading {
  depthCm: number;
  value: number;
  timestamp: string;
  unit: string;
}

/** Sensor físico (M316) o lógico (M316-1). */
export interface Sensor {
  id: string;
  stationId: string;
  name: string;
  location: string;
  /** excess | attention_high | irrigate | attention_low | deficit | no_data */
  status: string;
  lastReadingAt: string;
  readings: Reading[];
  alertMessage?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Punto de histórico de humedad. */
export interface HistoryPoint {
  timestamp: string;
  depth10cm: number;
  depth30cm: number;
}

/** Rangos de histórico soportados por la API. */
export type HistoryRange = '7d' | '30d' | '6m';

/**
 * Respuesta unificada detalle + histórico
 * (`GET /api/v1/sensors/{id}/with-history`).
 */
export interface SensorWithHistory {
  sensor: Sensor;
  history: HistoryPoint[];
  range: string;
}

/** Estado de navegación opcional desde el mapa hacia el detalle. */
export interface SensorNavState {
  sensor?: Sensor;
}
