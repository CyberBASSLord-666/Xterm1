import { TestBed } from '@angular/core/testing';
import { AppInitializerService } from '../app-initializer.service';
import { LoggerService } from '../logger.service';
import { ConfigService } from '../config.service';
import { RequestCacheService } from '../request-cache.service';
import { KeyboardShortcutsService } from '../keyboard-shortcuts.service';
import { PerformanceMonitorService } from '../performance-monitor.service';
import { AnalyticsService } from '../analytics.service';
import { environment } from '../../environments/environment';
import { initializeGeminiClient } from '../pollinations.client';

jest.mock('../pollinations.client', () => ({
  initializeGeminiClient: jest.fn(),
}));

const initializeGeminiClientMock = initializeGeminiClient as jest.MockedFunction<typeof initializeGeminiClient>;

class LoggerServiceStub {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
  setLogLevel = jest.fn();
}

class ConfigServiceStub {
  private geminiKey = '';
  private analyticsId = '';

  setGeminiApiKey(key: string): void {
    this.geminiKey = key;
  }

  getGeminiApiKey(): string {
    return this.geminiKey;
  }

  hasGeminiApiKey(): boolean {
    return this.geminiKey.length > 0;
  }

  setAnalyticsMeasurementId(measurementId: string): void {
    this.analyticsId = measurementId;
  }

  getAnalyticsMeasurementId(): string {
    return this.analyticsId;
  }

  hasAnalyticsMeasurementId(): boolean {
    return this.analyticsId.length > 0;
  }
}

class RequestCacheServiceStub {
  startPeriodicCleanup = jest.fn();
}

class KeyboardShortcutsServiceStub {}

class PerformanceMonitorServiceStub {
  measureAsync = jest.fn(async (_name: string, operation: () => Promise<void>) => {
    await operation();
  });
  getWebVitals = jest.fn().mockReturnValue({ lcp: 1234 });
  logSummary = jest.fn();
}

class AnalyticsServiceStub {
  setEnabled = jest.fn();
  initialize = jest.fn();
}

describe('AppInitializerService', () => {
  const originalProduction = environment.production;
  const originalBootstrapConfig = { ...(environment as any).bootstrapConfig };
  let originalLocation: Location;

  beforeEach(() => {
    jest.restoreAllMocks();
    initializeGeminiClientMock.mockResolvedValue(undefined);
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { protocol: 'https:', hostname: 'prod.polliwall.test', reload: jest.fn() },
    });
    (environment as any).bootstrapConfig = {
      meta: { geminiApiKey: 'gemini-api-key', analyticsMeasurementId: 'analytics-measurement-id' },
      failOnMissingGeminiKey: true,
    };
    environment.production = true;
  });

  afterEach(() => {
    environment.production = originalProduction;
    (environment as any).bootstrapConfig = originalBootstrapConfig;
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    document.head.querySelectorAll('meta[name="gemini-api-key"], meta[name="analytics-measurement-id"]').forEach(meta =>
      meta.remove()
    );
    delete (window as any).__POLLIWALL_RUNTIME_CONFIG__;
    initializeGeminiClientMock.mockReset();
  });

  function createService(): AppInitializerService {
    TestBed.configureTestingModule({
      providers: [
        AppInitializerService,
        { provide: LoggerService, useClass: LoggerServiceStub },
        { provide: ConfigService, useClass: ConfigServiceStub },
        { provide: RequestCacheService, useClass: RequestCacheServiceStub },
        { provide: KeyboardShortcutsService, useClass: KeyboardShortcutsServiceStub },
        { provide: PerformanceMonitorService, useClass: PerformanceMonitorServiceStub },
        { provide: AnalyticsService, useClass: AnalyticsServiceStub },
      ],
    });

    return TestBed.inject(AppInitializerService);
  }

  it('hydrates secrets from meta tags and initialises analytics and Gemini client', async () => {
    const geminiMeta = document.createElement('meta');
    geminiMeta.setAttribute('name', 'gemini-api-key');
    geminiMeta.setAttribute('content', 'prod-secret-key');
    document.head.appendChild(geminiMeta);

    const analyticsMeta = document.createElement('meta');
    analyticsMeta.setAttribute('name', 'analytics-measurement-id');
    analyticsMeta.setAttribute('content', 'G-PROD12345');
    document.head.appendChild(analyticsMeta);

    const service = createService();
    await service.initialize();

    const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;
    const config = TestBed.inject(ConfigService) as unknown as ConfigServiceStub;
    const requestCache = TestBed.inject(RequestCacheService) as unknown as RequestCacheServiceStub;
    const analytics = TestBed.inject(AnalyticsService) as unknown as AnalyticsServiceStub;

    expect(config.getGeminiApiKey()).toBe('prod-secret-key');
    expect(config.getAnalyticsMeasurementId()).toBe('G-PROD12345');
    expect(analytics.setEnabled).toHaveBeenCalledWith(true);
    expect(analytics.initialize).toHaveBeenCalledWith('G-PROD12345');
    expect(initializeGeminiClient).toHaveBeenCalledWith('prod-secret-key');
    expect(requestCache.startPeriodicCleanup).toHaveBeenCalledWith(60000);
    expect(logger.info).toHaveBeenCalledWith('Application initialized successfully', undefined, 'AppInitializer');
  });

  it('throws when the Gemini key is missing in production and fail-fast is enabled', async () => {
    const service = createService();

    await expect(service.initialize()).rejects.toThrow('Missing Gemini API key in production environment.');
    expect(initializeGeminiClient).not.toHaveBeenCalled();
  });

  it('accepts runtime configuration injected through global bootstrap object', async () => {
    delete (environment as any).bootstrapConfig.meta;
    (window as any).__POLLIWALL_RUNTIME_CONFIG__ = {
      geminiApiKey: 'runtime-key-123',
      analyticsMeasurementId: 'G-RUNTIME1',
    };

    const service = createService();
    await service.initialize();

    const config = TestBed.inject(ConfigService) as unknown as ConfigServiceStub;
    const analytics = TestBed.inject(AnalyticsService) as unknown as AnalyticsServiceStub;

    expect(config.getGeminiApiKey()).toBe('runtime-key-123');
    expect(config.getAnalyticsMeasurementId()).toBe('G-RUNTIME1');
    expect(initializeGeminiClient).toHaveBeenCalledWith('runtime-key-123');
    expect(analytics.initialize).toHaveBeenCalledWith('G-RUNTIME1');
  });
});
