import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { MenuController, ToastController } from '@ionic/angular';
import * as L from 'leaflet';

import { environment } from '../../../environments/environment';
import { Sensor } from '../../core/models/sensor';
import { Station } from '../../core/models/station';
import { SensorDataCacheService } from '../../core/services/sensor-data-cache.service';
import { SensorService } from '../../core/services/sensor.service';
import { StationService } from '../../core/services/station.service';

const CROP_FILTERS = ['Aguacate', 'Cacao', 'Lima', 'Papaya'] as const;

const STATUS_COLORS: Record<string, string> = {
  excess: '#FB8C00',
  attention_high: '#FBC02D',
  irrigate: '#FDD835',
  attention_low: '#FDD835',
  deficit: '#E53935',
  no_data: '#90CAF9',
  // Compatibilidad
  saturation: '#FB8C00',
  normal: '#FBC02D',
  attention: '#FDD835',
};

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
  standalone: false,
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  readonly cropFilters = CROP_FILTERS;
  selectedCrop: string | null = null;
  loading = true;
  error: string | null = null;
  stations: Station[] = [];
  sensors: Sensor[] = [];
  centerLat = environment.defaultLat;
  centerLng = environment.defaultLng;
  mapLat = environment.defaultLat;
  mapLng = environment.defaultLng;

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup | null = null;
  private streetLayer: L.TileLayer | null = null;
  private satelliteLayer: L.TileLayer | null = null;
  private usingSatellite = true;

  constructor(
    private readonly stationService: StationService,
    private readonly sensorService: SensorService,
    private readonly sensorCache: SensorDataCacheService,
    private readonly router: Router,
    private readonly menuCtrl: MenuController,
    private readonly toastCtrl: ToastController
  ) {}

  /** Sensores visibles según filtro de cultivo (expuesto al template). */
  get visibleSensors(): Sensor[] {
    return this.sensors.filter((s) => {
      if (s.latitude == null || s.longitude == null) {
        return false;
      }
      return this.matchesCrop(s);
    });
  }

  async ngOnInit(): Promise<void> {
    await this.resolveLocation();
    await this.loadStations();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 50);
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  /**
   * Abre el menú lateral.
   */
  async openMenu(): Promise<void> {
    await this.menuCtrl.open('main-menu');
  }

  /**
   * Aplica o quita el filtro de cultivo y redibuja marcadores.
   */
  selectCrop(crop: string | null): void {
    this.selectedCrop = this.selectedCrop === crop ? null : crop;
    this.renderMarkers();
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  /**
   * Recarga estaciones desde la API.
   */
  async refresh(): Promise<void> {
    await this.loadStations();
  }

  /**
   * Prefetch del histórico en background y navega al detalle con snapshot del sensor.
   * @param sensor Sensor seleccionado en el mapa.
   */
  openSensor(sensor: Sensor): void {
    this.sensorCache.setSensor(sensor);
    // Dispara with-history mientras navega (caché lista al pintar la gráfica).
    this.sensorService.prefetchWithHistory(sensor.id, '7d');
    void this.router.navigate(['/sensor', sensor.id], {
      state: { sensor },
    });
  }

  private async resolveLocation(): Promise<void> {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location === 'denied') {
        return;
      }
      const pos = await Geolocation.getCurrentPosition({
        timeout: 8000,
        enableHighAccuracy: false,
      });
      this.centerLat = pos.coords.latitude;
      this.centerLng = pos.coords.longitude;
      this.mapLat = this.centerLat;
      this.mapLng = this.centerLng;
    } catch {
      // Fallback al centro por defecto (Valle / Roldanillo).
    }
  }

  private async loadStations(): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      this.stations = await this.fetchStations(
        this.centerLat,
        this.centerLng,
        environment.defaultRadiusKm
      );

      if (this.flattenSensors(this.stations).length === 0) {
        // Sensores del catálogo están en el norte del Valle (~Roldanillo).
        // Si el GPS está en Cali/Palmira, ampliar búsqueda al clúster operativo.
        this.stations = await this.fetchStations(
          environment.defaultLat,
          environment.defaultLng,
          environment.fallbackRadiusKm
        );
      }

      this.sensors = this.flattenSensors(this.stations);
      for (const sensor of this.sensors) {
        this.sensorCache.setSensor(sensor);
      }
      this.renderMarkers();
      this.fitBounds();
    } catch (e) {
      this.error =
        e instanceof Error ? e.message : 'No se pudieron cargar estaciones';
      const toast = await this.toastCtrl.create({
        message: this.error,
        duration: 3500,
        color: 'warning',
      });
      await toast.present();
    } finally {
      this.loading = false;
      setTimeout(() => this.map?.invalidateSize(), 100);
    }
  }

  private async fetchStations(
    lat: number,
    lng: number,
    radiusKm: number
  ): Promise<Station[]> {
    return this.stationService.getNearby(lat, lng, radiusKm, true);
  }

  private flattenSensors(stations: Station[]): Sensor[] {
    const list: Sensor[] = [];
    for (const st of stations) {
      for (const sensor of st.sensors ?? []) {
        list.push({
          ...sensor,
          latitude: sensor.latitude ?? st.latitude,
          longitude: sensor.longitude ?? st.longitude,
          stationId: sensor.stationId || st.id,
        });
      }
    }
    return list;
  }

  private initMap(): void {
    if (this.map) {
      this.map.invalidateSize();
      this.renderMarkers();
      return;
    }

    // Fix default icon paths broken by bundlers.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    this.map = L.map('yarqua-map', {
      center: [this.mapLat, this.mapLng],
      zoom: 11,
      zoomControl: true,
    });

    this.satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }
    );
    this.streetLayer = L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }
    );

    // Satélite por defecto.
    this.satelliteLayer.addTo(this.map);
    this.usingSatellite = true;
    this.addLayerToggleControl();

    this.markersLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers();
    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  /**
   * Alterna entre capa satélite y calles.
   */
  private toggleMapLayer(): void {
    if (!this.map || !this.streetLayer || !this.satelliteLayer) {
      return;
    }
    if (this.usingSatellite) {
      this.map.removeLayer(this.satelliteLayer);
      this.streetLayer.addTo(this.map);
      this.usingSatellite = false;
    } else {
      this.map.removeLayer(this.streetLayer);
      this.satelliteLayer.addTo(this.map);
      this.usingSatellite = true;
    }
  }

  /**
   * Control Leaflet: botón de capa debajo del zoom (+/-) en topleft.
   */
  private addLayerToggleControl(): void {
    if (!this.map) {
      return;
    }
    const self = this;
    const LayerToggle = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create(
          'div',
          'leaflet-bar yarqua-layer-control'
        );
        const btn = L.DomUtil.create(
          'button',
          'yarqua-layer-btn',
          container
        ) as HTMLButtonElement;
        btn.type = 'button';
        btn.title = 'Cambiar capa del mapa';
        btn.setAttribute('aria-label', 'Cambiar capa del mapa');
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 2L2 7l10 5 10-5-10-5zm0 9L2 6v2l10 5 10-5V6l-10 5zm0 4L2 10v2l10 5 10-5v-2l-10 5z"/>' +
          '</svg>';
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        L.DomEvent.on(btn, 'click', (e: Event) => {
          L.DomEvent.stop(e);
          self.toggleMapLayer();
        });
        return container;
      },
    });
    new LayerToggle({ position: 'topleft' }).addTo(this.map);
  }

  private matchesCrop(sensor: Sensor): boolean {
    if (!this.selectedCrop) {
      return true;
    }
    return this.cropGroup(sensor) === this.selectedCrop;
  }

  private cropGroup(sensor: Sensor): string | null {
    const raw = `${sensor.name} ${sensor.location}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
    if (raw.includes('aguacate')) {
      return 'Aguacate';
    }
    if (raw.includes('cacao')) {
      return 'Cacao';
    }
    if (raw.includes('lima') || raw.includes('tahiti')) {
      return 'Lima';
    }
    if (raw.includes('papaya')) {
      return 'Papaya';
    }
    return null;
  }

  private markerIcon(sensorId: string, color: string, labelBelow: boolean): L.DivIcon {
    const label = this.escapeHtml(sensorId);
    const labelClass = labelBelow
      ? 'yarqua-marker-label yarqua-marker-label--below'
      : 'yarqua-marker-label yarqua-marker-label--above';
    return L.divIcon({
      className: 'yarqua-marker',
      html:
        `<div class="yarqua-marker-wrap">` +
        `<span class="${labelClass}" style="border-color:${color};color:#000000">${label}</span>` +
        `<span class="yarqua-marker-dot" style="background:${color}"></span>` +
        `</div>`,
      iconSize: [80, 58],
      iconAnchor: [40, labelBelow ? 20 : 38],
    });
  }

  private channelFromId(sensorId: string): number {
    const match = sensorId.match(/-(\d+)$/);
    return match ? Number.parseInt(match[1], 10) : 1;
  }

  private markerPosition(sensor: Sensor): [number, number] {
    const lat = sensor.latitude as number;
    const lng = sensor.longitude as number;
    const channel = this.channelFromId(sensor.id);
    const offset = channel === 1 ? 0.00085 : -0.00085;
    return [lat + offset, lng];
  }

  private renderMarkers(): void {
    if (!this.map || !this.markersLayer) {
      return;
    }
    this.markersLayer.clearLayers();

    const visible = this.visibleSensors;
    for (const sensor of visible) {
      const [lat, lng] = this.markerPosition(sensor);
      const color = STATUS_COLORS[sensor.status] ?? STATUS_COLORS['deficit'];
      const labelBelow = this.channelFromId(sensor.id) === 2;
      const marker = L.marker([lat, lng], {
        icon: this.markerIcon(sensor.id, color, labelBelow),
      });
      marker.bindPopup(
        `<strong>${this.escapeHtml(sensor.name)}</strong><br/>` +
          `${this.escapeHtml(sensor.id)} · ${this.escapeHtml(sensor.status)}`
      );
      marker.on('click', () => {
        this.openSensor(sensor);
      });
      marker.addTo(this.markersLayer);
    }

    // Si no hay sensores anidados, marcar estaciones.
    if (visible.length === 0) {
      for (const st of this.stations) {
        if (this.selectedCrop) {
          const hasCrop = (st.sensors ?? []).some((s) => this.matchesCrop(s));
          if ((st.sensors?.length ?? 0) > 0 && !hasCrop) {
            continue;
          }
          if ((st.sensors?.length ?? 0) === 0) {
            const nameMatch = this.cropGroup({
              id: st.id,
              stationId: st.id,
              name: st.name,
              location: st.name,
              status: 'normal',
              lastReadingAt: '',
              readings: [],
            });
            if (nameMatch !== this.selectedCrop) {
              continue;
            }
          }
        }
        const marker = L.marker([st.latitude, st.longitude], {
          icon: this.markerIcon(st.id, '#309020', false),
        });
        marker.bindPopup(
          `<strong>${this.escapeHtml(st.name)}</strong><br/>` +
            `${st.sensorCount} sensores`
        );
        const firstSensor = st.sensors?.[0];
        marker.on('click', () => {
          if (firstSensor) {
            void this.router.navigate(['/sensor', firstSensor.id]);
          }
        });
        marker.addTo(this.markersLayer!);
      }
    }
  }

  private fitBounds(): void {
    if (!this.map) {
      return;
    }
    const pts: L.LatLngExpression[] = this.visibleSensors.map((s) => {
      const [lat, lng] = this.markerPosition(s);
      return [lat, lng] as L.LatLngExpression;
    });
    if (pts.length === 0) {
      pts.push(
        ...this.stations.map(
          (s) => [s.latitude, s.longitude] as L.LatLngExpression
        )
      );
    }
    if (pts.length > 0) {
      this.map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 13 });
    } else {
      this.map.setView([this.mapLat, this.mapLng], 11);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
