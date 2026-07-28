import {
  buildMoistureSvgChart,
  targetXLabelCount,
  xLabelIntervalMs,
} from './moisture-svg-chart';
import { IrrigationCropProfile } from '../../Shared/Models/irrigation';
import { HistoryPoint } from '../../Shared/Models/sensor';

describe('buildMoistureSvgChart', () => {
  const cacao: IrrigationCropProfile = {
    name: 'Cacao',
    fieldCapacity: 34,
    maxIrrigationLimit: 27.2,
    irrigationDecision: 21.76,
  };

  const dayPoints = (
    days: number,
    startIso = '2026-06-27T12:00:00+00:00'
  ): HistoryPoint[] => {
    const start = new Date(startIso).getTime();
    return Array.from({ length: days }, (_, i) => ({
      timestamp: new Date(start + i * 24 * 60 * 60 * 1000).toISOString(),
      depth10cm: 40 + (i % 5),
      depth30cm: 38,
    }));
  };

  it('devuelve null sin historial', () => {
    expect(buildMoistureSvgChart([], cacao, 1)).toBeNull();
  });

  it('genera ejes, bandas y path con datos reales', () => {
    const chart = buildMoistureSvgChart(
      [
        {
          timestamp: '2026-07-24T14:00:00+00:00',
          depth10cm: 53,
          depth30cm: 51,
        },
        {
          timestamp: '2026-07-25T14:00:00+00:00',
          depth10cm: 50,
          depth30cm: 48,
        },
        {
          timestamp: '2026-07-27T14:00:00+00:00',
          depth10cm: 48,
          depth30cm: 43,
        },
      ],
      cacao,
      1,
      '7d'
    );

    expect(chart).not.toBeNull();
    expect(chart!.bands.length).toBe(5);
    expect(chart!.yTicks.length).toBe(8);
    expect(chart!.yTicks[chart!.yTicks.length - 1].label).toBe('70');
    expect(chart!.xLabels.length).toBeGreaterThan(0);
    expect(chart!.xLabels[0].transform).toContain('rotate(-55');
    expect(chart!.linePath.startsWith('M')).toBeTrue();
    expect(chart!.linePath.includes(' L')).toBeTrue();
  });

  it('en 30d coloca al menos 14 etiquetas', () => {
    const chart = buildMoistureSvgChart(dayPoints(31), cacao, 1, '30d');
    expect(chart).not.toBeNull();
    expect(chart!.xLabels.length).toBeGreaterThanOrEqual(14);
    expect(chart!.xLabels.length).toBeLessThanOrEqual(16);
  });

  it('en 6m coloca ~2 etiquetas por mes', () => {
    const chart = buildMoistureSvgChart(dayPoints(180), cacao, 1, '6m');
    expect(chart).not.toBeNull();
    expect(chart!.xLabels.length).toBeGreaterThanOrEqual(10);
    expect(chart!.xLabels.length).toBeLessThanOrEqual(14);
  });
});

describe('targetXLabelCount', () => {
  const day = 24 * 60 * 60 * 1000;

  it('usa densidades por rango', () => {
    expect(targetXLabelCount('7d', 7 * day)).toBe(8);
    expect(targetXLabelCount('30d', 30 * day)).toBe(15);
    expect(targetXLabelCount('6m', 180 * day)).toBe(12);
  });
});

describe('xLabelIntervalMs', () => {
  const day = 24 * 60 * 60 * 1000;

  it('deriva intervalo desde el conteo objetivo', () => {
    expect(xLabelIntervalMs('30d', 30 * day)).toBeCloseTo((30 * day) / 14, 0);
  });
});
