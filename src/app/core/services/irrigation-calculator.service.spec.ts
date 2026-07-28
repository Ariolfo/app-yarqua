import { IrrigationCalculatorService } from './irrigation-calculator.service';

describe('IrrigationCalculatorService', () => {
  const service = new IrrigationCalculatorService();

  it('incluye los valores del Excel para Aguacate', () => {
    const crop = service.cropProfiles[0];
    expect(service.cropProfiles.map((c) => c.name)).toEqual([
      'Aguacate',
      'Cacao',
      'Lima',
      'Papaya',
    ]);
    expect(crop.name).toBe('Aguacate');
    expect(crop.fieldCapacity).toBe(39);
    expect(crop.maxIrrigationLimit).toBe(31.2);
    expect(crop.irrigationDecision).toBe(24.96);
  });

  it('recomienda no regar cuando ambas lecturas superan el umbral', () => {
    expect(service.recommendation(28, 27.5, 24.96)).toBe('No regar');
  });

  it('recomienda regar cuando alguna lectura está bajo el umbral', () => {
    expect(service.recommendation(24, 25.5, 24.96)).toBe('Regar');
  });

  it('recomienda regar cuando la tarde está bajo el umbral', () => {
    expect(service.recommendation(30, 20, 24.96)).toBe('Regar');
  });

  it('getProfile encuentra el cultivo por nombre', () => {
    expect(service.getProfile('Cacao')?.irrigationDecision).toBe(21.76);
    expect(service.getProfile('Desconocido')).toBeUndefined();
  });

  it('resolveProfileFromText detecta el cultivo en el nombre del sensor', () => {
    const profile = service.resolveProfileFromText('Sensor M319-1 – Cacao');
    expect(profile.name).toBe('Cacao');
    expect(profile.fieldCapacity).toBe(34);
  });
});
