/**
 * Build PWA pública: service worker + API vía túnel ngrok.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://hidrix.ngrok.app/api/v1',
  defaultLat: 4.5255,
  defaultLng: -76.0755,
  defaultRadiusKm: 50,
  fallbackRadiusKm: 150,
  appName: 'Hidrix',
};
