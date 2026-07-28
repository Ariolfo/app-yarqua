import { HistoryPoint, HistoryRange } from '../../Shared/Models/sensor';
import { IrrigationCropProfile } from '../../Shared/Models/irrigation';

export const CHART_Y_MAX = 70;
export const SOIL_FLOOR = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

export const BAND_COLORS = {
  red: 'rgba(255, 0, 0, 0.09)',
  greenLight: 'rgba(145, 217, 148, 0.57)',
  greenDark: 'rgba(145, 217, 148, 1)',
  blue: 'rgba(44, 182, 253, 0.39)',
} as const;

export interface SvgBand {
  y: number;
  height: number;
  color: string;
}

export interface SvgTick {
  y: number;
  label: string;
}

export interface SvgXLabel {
  x: number;
  y: number;
  label: string;
  /** rotate(-55, x, y) para fechas legibles densas. */
  transform: string;
}

export interface MoistureSvgChart {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  bands: SvgBand[];
  yTicks: SvgTick[];
  xLabels: SvgXLabel[];
  linePath: string;
  yTitleX: number;
  yTitleY: number;
}

/**
 * Cantidad objetivo de etiquetas X según el rango.
 * - 7d: ~diario
 * - 30d: ≥14 (≈ cada 2 días)
 * - 6m: ~2 por mes
 */
export function targetXLabelCount(
  range: HistoryRange | undefined,
  spanMs: number
): number {
  switch (range) {
    case '7d':
      return 8;
    case '30d':
      return 15;
    case '6m':
      return 12;
    default:
      if (spanMs <= 10 * DAY_MS) {
        return 8;
      }
      if (spanMs <= 40 * DAY_MS) {
        return 15;
      }
      return 12;
  }
}

/** @deprecated Preferir {@link targetXLabelCount}; se mantiene para tests/compat. */
export function xLabelIntervalMs(
  range: HistoryRange | undefined,
  spanMs: number
): number {
  const count = Math.max(2, targetXLabelCount(range, spanMs));
  return spanMs / (count - 1);
}

function formatXLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Índice del punto cuya fecha está más cerca de `targetMs`.
 */
function nearestIndex(
  times: number[],
  targetMs: number,
  from = 0
): number {
  let best = from;
  let bestDist = Math.abs(times[from] - targetMs);
  for (let i = from; i < times.length; i++) {
    const d = Math.abs(times[i] - targetMs);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
    // Serie ordenada: si ya nos pasamos y empeora, cortar.
    if (times[i] > targetMs && d > bestDist) {
      break;
    }
  }
  return best;
}

function buildXLabels(
  history: HistoryPoint[],
  plotLeft: number,
  plotW: number,
  plotBottom: number,
  range?: HistoryRange
): SvgXLabel[] {
  const n = history.length;
  if (n === 0) {
    return [];
  }

  const xAt = (i: number) =>
    plotLeft + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  const labelY = plotBottom + 12;
  const toLabel = (i: number): SvgXLabel => {
    const x = xAt(i);
    return {
      x,
      y: labelY,
      label: formatXLabel(history[i].timestamp),
      transform: `rotate(-55, ${x}, ${labelY})`,
    };
  };

  if (n === 1) {
    return [toLabel(0)];
  }

  const times = history.map((p) => new Date(p.timestamp).getTime());
  const t0 = times[0];
  const t1 = times[n - 1];
  const spanMs = Math.max(DAY_MS, t1 - t0);
  const target = Math.min(n, targetXLabelCount(range, spanMs));

  // Reparto uniforme en el tiempo → densidad estable (p. ej. 15 en 30d).
  const indices: number[] = [];
  let searchFrom = 0;
  for (let k = 0; k < target; k++) {
    const targetMs = t0 + (spanMs * k) / (target - 1);
    const idx = nearestIndex(times, targetMs, searchFrom);
    if (indices.length === 0 || indices[indices.length - 1] !== idx) {
      indices.push(idx);
    }
    searchFrom = idx;
  }
  if (indices[indices.length - 1] !== n - 1) {
    indices.push(n - 1);
  }

  // Solo fusionar si el texto es el mismo Y están muy juntas en X.
  const labels: SvgXLabel[] = [];
  for (const i of indices) {
    const next = toLabel(i);
    const prev = labels[labels.length - 1];
    if (prev && prev.label === next.label && Math.abs(next.x - prev.x) < 14) {
      labels[labels.length - 1] = next;
      continue;
    }
    labels.push(next);
  }

  return labels;
}

/**
 * Construye el modelo SVG del gráfico de humedad (ejes + bandas + serie real).
 */
export function buildMoistureSvgChart(
  history: HistoryPoint[],
  profile: IrrigationCropProfile,
  channel: 1 | 2,
  range?: HistoryRange
): MoistureSvgChart | null {
  if (!history.length) {
    return null;
  }

  const width = 360;
  // Más alto para etiquetas X inclinadas (~55°) sin recorte.
  const height = 300;
  const plotLeft = 42;
  const plotRight = 348;
  const plotTop = 16;
  const plotBottom = 232;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const yToPx = (value: number) =>
    plotTop + ((CHART_Y_MAX - value) / CHART_Y_MAX) * plotH;

  const bandsSrc = [
    { min: 0, max: SOIL_FLOOR, color: BAND_COLORS.red },
    {
      min: SOIL_FLOOR,
      max: profile.irrigationDecision,
      color: BAND_COLORS.greenLight,
    },
    {
      min: profile.irrigationDecision,
      max: profile.maxIrrigationLimit,
      color: BAND_COLORS.greenDark,
    },
    {
      min: profile.maxIrrigationLimit,
      max: profile.fieldCapacity,
      color: BAND_COLORS.greenLight,
    },
    {
      min: profile.fieldCapacity,
      max: CHART_Y_MAX,
      color: BAND_COLORS.blue,
    },
  ];

  const bands: SvgBand[] = bandsSrc.map((b) => {
    const yTop = yToPx(b.max);
    const yBottom = yToPx(b.min);
    return {
      y: yTop,
      height: Math.max(0, yBottom - yTop),
      color: b.color,
    };
  });

  const yTicks: SvgTick[] = [0, 10, 20, 30, 40, 50, 60, 70].map((v) => ({
    y: yToPx(v),
    label: String(v),
  }));

  const n = history.length;
  const xLabels = buildXLabels(history, plotLeft, plotW, plotBottom, range);

  const points = history.map((p, i) => {
    const value = channel === 2 ? p.depth30cm : p.depth10cm;
    const x = plotLeft + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = yToPx(Math.min(CHART_Y_MAX, Math.max(0, value)));
    return { x, y };
  });

  const linePath = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  return {
    width,
    height,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    bands,
    yTicks,
    xLabels,
    linePath,
    yTitleX: 14,
    yTitleY: (plotTop + plotBottom) / 2,
  };
}
