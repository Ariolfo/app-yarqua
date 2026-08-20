/** Cultivo del catálogo Hidrix. */
export interface Crop {
  id: number;
  name: string;
  fieldCapacity: number;
  maxIrrigationLimit: number;
  irrigationDecision: number;
}

/** Red de sensores con país. */
export interface Network {
  id: number;
  name: string;
  countryId: number;
  countryName: string;
}

/** Sensor del catálogo (tabla HidrtbSensor). */
export interface CatalogSensor {
  id: number;
  name: string;
  networkId: number;
  networkName: string;
  countryId: number;
  countryName: string;
  cropId?: number | null;
  cropName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  sensorStatus?: string | null;
  connectivity?: string | null;
  farm?: string | null;
}

export interface CreateCropPayload {
  name: string;
  fieldCapacity: number;
  maxIrrigationLimit: number;
  irrigationDecision: number;
}

export interface CreateCatalogSensorPayload {
  name: string;
  networkId: number;
  cropId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  sensorStatus?: string | null;
  connectivity?: string | null;
  farm?: string | null;
}
