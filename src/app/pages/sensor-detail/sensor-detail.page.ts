import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { from, firstValueFrom, timeout } from 'rxjs';

import {
  HistoryPoint,
  HistoryRange,
  Sensor,
  SensorNavState,
} from '../../core/models/sensor';
import { IrrigationCropProfile } from '../../core/models/irrigation';
import { IrrigationCalculatorService } from '../../core/services/irrigation-calculator.service';
import { SensorDataCacheService } from '../../core/services/sensor-data-cache.service';
import { SensorService } from '../../core/services/sensor.service';
import { normalizeHistoryPoints } from './normalize-history';
import {
  BAND_COLORS,
  CHART_Y_MAX,
  MoistureSvgChart,
  SOIL_FLOOR,
  buildMoistureSvgChart,
} from './moisture-svg-chart';

/** Timeout de carga unificada (alineado bajo el HttpClient Visualiti de 60 s). */
const BUNDLE_TIMEOUT_MS = 45000;

const STATUS_LABELS: Record<string, string> = {
  excess: 'Exceso',
  attention_high: 'Atención: humedad arriba de CC',
  irrigate: 'Regar',
  attention_low: 'Atención: humedad abajo de CC',
  deficit: 'Déficit',
  no_data: 'Sin datos',
  saturation: 'Exceso',
  normal: 'Atención: humedad arriba de CC',
  attention: 'Regar',
};

const ALERT_LABELS: Record<string, string> = {
  excess: 'EXCESO',
  attention_high: 'ATENCIÓN: HUMEDAD ARRIBA DE CC',
  irrigate: 'REGAR',
  attention_low: 'ATENCIÓN: HUMEDAD ABAJO DE CC',
  deficit: 'DÉFICIT',
  saturation: 'EXCESO',
  attention: 'REGAR',
};

/**
 * Detalle de sensor: badge de estado CC + gráfica SVG de histórico.
 * Carga unificada vía GET /sensors/{id}/with-history (un viaje Visualiti).
 */
@Component({
  selector: 'app-sensor-detail',
  templateUrl: './sensor-detail.page.html',
  styleUrls: ['./sensor-detail.page.scss'],
  standalone: false,
})
export class SensorDetailPage implements OnInit, OnDestroy {
  private historyRequest = 0;
  private destroy = false;
  private readonly navSeed: Sensor | null;

  sensorId = '';
  sensor: Sensor | null = null;
  history: HistoryPoint[] = [];
  svgChart: MoistureSvgChart | null = null;
  range: HistoryRange = '7d';
  readonly ranges: { value: HistoryRange; label: string }[] = [
    { value: '7d', label: 'ÚLTIMOS 7 DÍAS' },
    { value: '30d', label: 'ÚLTIMOS 30 DÍAS' },
    { value: '6m', label: 'SEIS MESES' },
  ];
  loading = false;
  chartLoading = false;
  chartError: string | null = null;
  cropProfile: IrrigationCropProfile | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly navCtrl: NavController,
    private readonly sensorService: SensorService,
    private readonly sensorCache: SensorDataCacheService,
    private readonly irrigationCalculator: IrrigationCalculatorService,
    private readonly toastCtrl: ToastController,
    private readonly cdr: ChangeDetectorRef
  ) {
    // getCurrentNavigation() solo es fiable en el constructor (A2: seed desde mapa).
    const state = this.router.getCurrentNavigation()?.extras
      ?.state as SensorNavState | undefined;
    this.navSeed = state?.sensor ?? null;
  }

  get headerTitle(): string {
    if (!this.sensorId) {
      return 'Sensor';
    }
    const crop = this.cropLabel;
    return crop ? `Sensor ${this.sensorId} – ${crop}` : `Sensor ${this.sensorId}`;
  }

  get cropLabel(): string | null {
    if (!this.sensor?.name) {
      return this.cropProfile?.name ?? null;
    }
    const parts = this.sensor.name.split(/[–-]/);
    if (parts.length >= 2) {
      const crop = parts[parts.length - 1].trim();
      return crop || null;
    }
    return this.cropProfile?.name ?? null;
  }

  get activeProfile(): IrrigationCropProfile {
    return (
      this.cropProfile ??
      this.irrigationCalculator.resolveProfileFromText(
        this.sensor?.name ?? this.sensorId
      )
    );
  }

  /** Bandas CSS de respaldo (mismas fórmulas) si aún no hay SVG. */
  get cssBands(): { bottom: string; height: string; color: string }[] {
    const p = this.activeProfile;
    const toPct = (v: number) => `${(v / CHART_Y_MAX) * 100}%`;
    return [
      { bottom: toPct(0), height: toPct(SOIL_FLOOR), color: BAND_COLORS.red },
      {
        bottom: toPct(SOIL_FLOOR),
        height: toPct(Math.max(0, p.irrigationDecision - SOIL_FLOOR)),
        color: BAND_COLORS.greenLight,
      },
      {
        bottom: toPct(p.irrigationDecision),
        height: toPct(Math.max(0, p.maxIrrigationLimit - p.irrigationDecision)),
        color: BAND_COLORS.greenDark,
      },
      {
        bottom: toPct(p.maxIrrigationLimit),
        height: toPct(Math.max(0, p.fieldCapacity - p.maxIrrigationLimit)),
        color: BAND_COLORS.greenLight,
      },
      {
        bottom: toPct(p.fieldCapacity),
        height: toPct(Math.max(0, CHART_Y_MAX - p.fieldCapacity)),
        color: BAND_COLORS.blue,
      },
    ];
  }

  get bandLegendItems(): { label: string; className: string }[] {
    const cc = this.activeProfile.fieldCapacity;
    const upper = this.activeProfile.maxIrrigationLimit;
    const lower = this.activeProfile.irrigationDecision;
    return [
      { label: `Exceso > CC (${cc.toFixed(1)} %)`, className: 'excess' },
      {
        label: `Límite superior riego ${upper.toFixed(1)}–${cc.toFixed(1)} %`,
        className: 'ideal-light',
      },
      {
        label: `Volver a regar ${lower.toFixed(1)}–${upper.toFixed(1)} %`,
        className: 'ideal-dark',
      },
      {
        label: `Transición ${SOIL_FLOOR}–${lower.toFixed(1)} %`,
        className: 'ideal-light',
      },
      { label: `Crítico < ${SOIL_FLOOR} %`, className: 'critical' },
    ];
  }

  get statusLabel(): string {
    if (!this.sensor) {
      return '';
    }
    if (this.badgeStatus === 'no_data') {
      return '';
    }
    return STATUS_LABELS[this.sensor.status] ?? this.sensor.status;
  }

  /** Estado visual del badge (sin lecturas → no_data). */
  get badgeStatus(): string {
    if (!this.sensor?.readings?.length || this.sensor.status === 'no_data') {
      return 'no_data';
    }
    return this.sensor.status;
  }

  get alertBanner(): string | null {
    if (!this.sensor) {
      return null;
    }
    if (
      this.badgeStatus === 'no_data' ||
      this.sensor.status === 'attention_high' ||
      this.sensor.status === 'normal'
    ) {
      return null;
    }
    const fromApi = this.sensor.alertMessage?.trim();
    if (fromApi) {
      return fromApi.replace(/^ALERTA:\s*/i, '').toUpperCase();
    }
    return ALERT_LABELS[this.sensor.status] ?? null;
  }

  get moistureDisplay(): string {
    if (this.badgeStatus === 'no_data') {
      return 'Sin datos';
    }
    if (!this.sensor?.readings?.length) {
      return 'Sin datos';
    }
    const channel = this.logicalChannel();
    const reading =
      this.sensor.readings.find((r) =>
        channel === 2 ? r.depthCm === 30 : r.depthCm === 10
      ) ?? this.sensor.readings[0];
    return `${reading.value.toFixed(1)} %`;
  }

  async ngOnInit(): Promise<void> {
    this.sensorId = this.route.snapshot.paramMap.get('id') ?? '';
    this.cropProfile =
      this.irrigationCalculator.resolveProfileFromText(this.sensorId);
    this.applyNavStateSeed();
    await this.loadBundle();
  }

  ngOnDestroy(): void {
    this.destroy = true;
  }

  /**
   * Cambia el rango temporal y recarga el paquete detalle+histórico.
   * @param range Nuevo rango.
   */
  async changeRange(range: HistoryRange): Promise<void> {
    if (this.range === range) {
      return;
    }
    this.range = range;
    this.history = [];
    this.svgChart = null;
    this.cdr.detectChanges();
    await this.loadBundle({ historyOnlyUi: true });
  }

  async goMap(): Promise<void> {
    await this.navCtrl.navigateRoot('/map');
  }

  /**
   * Pinta el badge de inmediato con datos del mapa o de la caché local (A2/A4).
   */
  private applyNavStateSeed(): void {
    const seeded =
      (this.navSeed && this.navSeed.id === this.sensorId
        ? this.navSeed
        : null) ?? this.sensorCache.getSensor(this.sensorId);

    if (!seeded) {
      return;
    }

    this.sensor = seeded;
    this.cropProfile = this.irrigationCalculator.resolveProfileFromText(
      seeded.name
    );
    this.sensorCache.setSensor(seeded);
  }

  /**
   * Carga unificada (A1 + B5): un GET with-history; usa caché cliente (A4).
   * @param options.historyOnlyUi Si true, no bloquea el badge con loading global.
   */
  private async loadBundle(options?: {
    historyOnlyUi?: boolean;
  }): Promise<void> {
    const requestId = ++this.historyRequest;
    const historyOnly = options?.historyOnlyUi === true;

    if (!historyOnly && !this.sensor) {
      this.loading = true;
    }
    this.chartLoading = true;
    this.chartError = null;
    this.cdr.detectChanges();

    try {
      const bundle = await firstValueFrom(
        from(
          this.sensorService.getWithHistory(this.sensorId, this.range)
        ).pipe(timeout(BUNDLE_TIMEOUT_MS))
      );

      if (this.destroy || requestId !== this.historyRequest) {
        return;
      }

      this.sensor = bundle.sensor;
      this.cropProfile = this.irrigationCalculator.resolveProfileFromText(
        bundle.sensor.name
      );
      this.applyHistory(bundle.history);
      this.cdr.detectChanges();
    } catch (e) {
      if (this.destroy || requestId !== this.historyRequest) {
        return;
      }
      this.history = [];
      this.svgChart = null;
      this.chartError =
        e instanceof Error
          ? e.message
          : 'No se pudo cargar el histórico del sensor';
      if (!this.sensor) {
        await this.toast(
          e instanceof Error ? e.message : 'No se pudo cargar el sensor'
        );
      } else {
        await this.toast(this.chartError);
      }
    } finally {
      if (!this.destroy && requestId === this.historyRequest) {
        this.loading = false;
        this.chartLoading = false;
        this.cdr.detectChanges();
      }
    }
  }

  private applyHistory(raw: HistoryPoint[] | unknown): void {
    this.history = normalizeHistoryPoints(raw);
    this.svgChart = buildMoistureSvgChart(
      this.history,
      this.activeProfile,
      this.logicalChannel(),
      this.range
    );
    if (!this.history.length || !this.svgChart) {
      this.chartError = 'Sin lecturas en este rango';
      this.svgChart = null;
    }
  }

  private logicalChannel(): 1 | 2 {
    const m = /-(\d+)$/.exec(this.sensorId);
    return m && m[1] === '2' ? 2 : 1;
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastCtrl.create({
      message,
      duration: 3000,
      color: 'warning',
    });
    await t.present();
  }
}
