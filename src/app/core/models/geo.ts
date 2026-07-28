/** País del catálogo geográfico. */
export interface GeoCountry {
  id: number;
  name: string;
}

/** Departamento / provincia. */
export interface GeoDepartment {
  id: number;
  code: string;
  name: string;
  paisId: number;
}

/** Ciudad / municipio. */
export interface GeoCity {
  id: number;
  code: string;
  name: string;
  depoId: number;
}
