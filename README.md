# Yarqua (Ionic)

App móvil de **Yarqua** — riego inteligente (FONTAGRO AGRO 4.0 · AGROSAVIA).

Stack: **Ionic 8 + Angular 20 + Capacitor 8** (NgModules).

## Requisitos

- Node.js **≥ 22** (Capacitor 8)
- Backend `ws-yarqua` levantado (ver sección siguiente)

## Backend (ws-yarqua) — el otro lado

La app consume la API en el puerto **5080**. SQL Server (Docker) en **1433**.

| Servicio | URL / puerto |
|----------|----------------|
| API HTTP | `http://localhost:5080` |
| API base (app) | `http://127.0.0.1:5080/api/v1` |
| Swagger | `http://localhost:5080/swagger` |
| Health | `http://localhost:5080/health` |
| SQL Server | `localhost:1433` · base `dbYarqua` |

```bash
cd ../ws-yarqua   # o la ruta del repo ws-yarqua
docker compose up -d
./database/install.sh

export PATH="$HOME/.dotnet:$PATH"
dotnet run --project src/Yarqua.Api --launch-profile http
```

Detalle (secretos, capas, endpoints): ver `ws-yarqua/README.md`.

## Instalación

```bash
cd app-yarqua
npm install
```

## Desarrollo web

```bash
npx ionic serve
# o
npm start
```

Abre **`http://localhost:8100`**. La app inicia en `/splash`, registra sin contraseña y muestra el mapa OSM (Leaflet).

### API base URL

En `src/environments/environment.ts`:

```ts
apiBaseUrl: 'http://127.0.0.1:5080/api/v1',
// Emulador Android (sin adb reverse):
// apiBaseUrl: 'http://10.0.2.2:5080/api/v1',
// Dispositivo físico: adb reverse tcp:5080 tcp:5080 + 127.0.0.1
```

Producción: placeholder en `environment.prod.ts`.

## Capacitor (Android / iOS)

```bash
# Compilar web
npm run build

# Sincronizar nativo
npx cap sync

# Abrir IDEs
npx cap open android
npx cap open ios
```

Primera vez (si faltan plataformas):

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npx cap sync
```

- **appId:** `co.agrosavia.yarqua`
- **appName:** `Yarqua`

## Pantallas

| Ruta | Descripción |
|------|-------------|
| `/splash` | Logo + chequeo de sesión |
| `/register` | Nombre + país/depto/ciudad |
| `/map` | Mapa OSM, chips de cultivo, marcadores |
| `/sensor/:id` | Detalle + histórico Chart.js (7d / 30d / 6m) |
| `/irrigation-calculator` | Calculadora local de riego |

Menú lateral: Mapa, Calculadora de riego, Cerrar sesión.

## Tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Estructura

```
src/app/core/          # models, services, guards
src/app/pages/         # splash, register, map, sensor-detail, irrigation-calculator
src/environments/      # apiBaseUrl
```
