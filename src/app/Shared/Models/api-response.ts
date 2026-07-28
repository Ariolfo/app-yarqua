/** Sobre uniforme de respuesta de la API Yarqua. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}
