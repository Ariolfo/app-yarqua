/**
 * Configuración de producción (PWA / hosting web + Capacitor sync).
 * Sustituir `apiBaseUrl` por la URL HTTPS real del backend desplegado.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://YOUR_API_HOST/api/v1',
  defaultLat: 4.5255,
  defaultLng: -76.0755,
  defaultRadiusKm: 50,
  fallbackRadiusKm: 150,
  appName: 'Yarqua',
};
