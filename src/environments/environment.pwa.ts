/**
 * Build PWA local: service worker activo + API en localhost.
 * Usar con `npm run build:pwa` / `npm run serve:pwa`.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'http://127.0.0.1:5080/api/v1',
  defaultLat: 4.5255,
  defaultLng: -76.0755,
  defaultRadiusKm: 50,
  fallbackRadiusKm: 150,
  appName: 'Yarqua',
};
