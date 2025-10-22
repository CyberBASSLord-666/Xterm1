import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config.service';
import { environment } from '../../environments/environment';

describe('ConfigService', () => {
  const originalDefaults = { ...(environment as any).defaults };
  const originalLegacyGemini = (environment as any).geminiApiKey;
  const originalLegacyAnalytics = (environment as any).analyticsMeasurementId;

  beforeEach(() => {
    (environment as any).defaults = { geminiApiKey: '  initial-key  ', analyticsMeasurementId: ' G-INIT ' };
    delete (environment as any).geminiApiKey;
    delete (environment as any).analyticsMeasurementId;
    TestBed.configureTestingModule({ providers: [ConfigService] });
  });

  afterEach(() => {
    (environment as any).defaults = originalDefaults;
    (environment as any).geminiApiKey = originalLegacyGemini;
    (environment as any).analyticsMeasurementId = originalLegacyAnalytics;
  });

  it('normalizes environment defaults at construction time', () => {
    const service = TestBed.inject(ConfigService);

    expect(service.getGeminiApiKey()).toBe('initial-key');
    expect(service.getAnalyticsMeasurementId()).toBe('G-INIT');
    expect(service.hasGeminiApiKey()).toBe(true);
    expect(service.hasAnalyticsMeasurementId()).toBe(true);
  });

  it('trims runtime values when setting secrets', () => {
    const service = TestBed.inject(ConfigService);

    service.setGeminiApiKey('  runtime-key  ');
    service.setAnalyticsMeasurementId('  G-RUNTIME  ');

    expect(service.getGeminiApiKey()).toBe('runtime-key');
    expect(service.getAnalyticsMeasurementId()).toBe('G-RUNTIME');
  });

  it('reports missing configuration when blank strings are provided', () => {
    const service = TestBed.inject(ConfigService);

    service.setGeminiApiKey('   ');
    service.setAnalyticsMeasurementId('');

    expect(service.hasGeminiApiKey()).toBe(false);
    expect(service.hasAnalyticsMeasurementId()).toBe(false);
  });
});
