import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { CspMonitoringService } from '../csp-monitoring.service';
import { LoggerService } from '../logger.service';
import { PlatformService } from '../platform.service';
import { AnalyticsService } from '../analytics.service';

class LoggerServiceStub {
  info = jest.fn();
  warn = jest.fn();
}

class PlatformServiceStub {
  isBrowser = true;
  addEventListener = jest.fn();
  getDocument = jest.fn(() => document);
  getWindow = jest.fn();
}

class AnalyticsServiceStub {
  trackEvent = jest.fn();
}

describe('CspMonitoringService', () => {
  let service: CspMonitoringService;
  let logger: LoggerServiceStub;
  let platform: PlatformServiceStub;
  let analytics: AnalyticsServiceStub;
  let fetchWasDefined = false;

  beforeEach(() => {
    fetchWasDefined = 'fetch' in globalThis;
    if (!fetchWasDefined) {
      Object.defineProperty(globalThis, 'fetch', {
        configurable: true,
        writable: true,
        value: jest.fn(),
      });
    }

    TestBed.configureTestingModule({
      providers: [
        CspMonitoringService,
        { provide: LoggerService, useClass: LoggerServiceStub },
        { provide: PlatformService, useClass: PlatformServiceStub },
        { provide: AnalyticsService, useClass: AnalyticsServiceStub },
        { provide: DOCUMENT, useValue: document },
      ],
    });

    service = TestBed.inject(CspMonitoringService);
    logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;
    platform = TestBed.inject(PlatformService) as unknown as PlatformServiceStub;
    analytics = TestBed.inject(AnalyticsService) as unknown as AnalyticsServiceStub;
  });

  afterEach(() => {
    document.head.querySelector('meta[name="csp-report-endpoint"]')?.remove();
    jest.restoreAllMocks();
    if (!fetchWasDefined) {
      delete (globalThis as Partial<typeof globalThis>).fetch;
    }
  });

  function createViolationEvent(overrides: Partial<SecurityPolicyViolationEvent> = {}): Event {
    return {
      blockedURI: 'https://malicious.example/script.js',
      violatedDirective: 'script-src',
      effectiveDirective: 'script-src',
      originalPolicy: "default-src 'self'",
      sourceFile: 'https://example.com/app.js',
      lineNumber: 10,
      columnNumber: 12,
      disposition: 'enforce',
      referrer: 'https://example.com',
      ...overrides,
    } as unknown as Event;
  }

  it('registers monitoring once and reports violations through sendBeacon', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'csp-report-endpoint');
    meta.setAttribute('content', '/custom-csp-report');
    document.head.appendChild(meta);

    const sendBeacon = jest.fn(() => true);
    platform.getWindow.mockReturnValue({
      navigator: { sendBeacon },
    } as unknown as Window);

    service.initialize();
    service.initialize();

    expect(platform.addEventListener).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      'CSP monitoring initialized',
      { endpoint: '/custom-csp-report' },
      'CspMonitoring'
    );

    const violationListener = platform.addEventListener.mock.calls[0][2] as (event: Event) => void;
    violationListener(createViolationEvent());

    expect(logger.warn).toHaveBeenCalledWith(
      'CSP violation detected',
      expect.objectContaining({
        blockedUri: 'https://malicious.example/script.js',
        effectiveDirective: 'script-src',
      }),
      'CspMonitoring'
    );
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'csp_violation',
        category: 'security',
        label: 'script-src',
      })
    );
    expect(sendBeacon).toHaveBeenCalledWith('/custom-csp-report', expect.any(Blob));
  });

  it('falls back to fetch when sendBeacon is unavailable', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    platform.getWindow.mockReturnValue({
      navigator: {},
    } as unknown as Window);

    service.initialize();
    const violationListener = platform.addEventListener.mock.calls[0][2] as (event: Event) => void;
    violationListener(
      createViolationEvent({
        effectiveDirective: 'style-src',
        blockedURI: 'inline',
      })
    );

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/csp-report',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/csp-report' },
      })
    );
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'style-src',
      })
    );
  });

  it('falls back to fetch when sendBeacon cannot queue the report', async () => {
    const sendBeacon = jest.fn(() => false);
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);

    platform.getWindow.mockReturnValue({
      navigator: { sendBeacon },
    } as unknown as Window);

    service.initialize();
    const violationListener = platform.addEventListener.mock.calls[0][2] as (event: Event) => void;
    violationListener(createViolationEvent());

    await Promise.resolve();

    expect(sendBeacon).toHaveBeenCalledWith('/api/csp-report', expect.any(Blob));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/csp-report',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/csp-report' },
      })
    );
    expect(logger.warn).toHaveBeenCalledWith(
      'sendBeacon could not queue CSP violation report; falling back to fetch',
      { endpoint: '/api/csp-report' },
      'CspMonitoring'
    );
  });
});
