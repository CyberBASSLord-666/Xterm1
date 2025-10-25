import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from '../analytics.service';
import { LoggerService } from '../logger.service';
import { environment } from '../../environments/environment';

class LoggerServiceStub {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
  setLogLevel = jest.fn();
}

describe('AnalyticsService', () => {
  const originalProduction = environment.production;
  let appendSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    TestBed.configureTestingModule({
      providers: [AnalyticsService, { provide: LoggerService, useClass: LoggerServiceStub }],
    });
    appendSpy = jest.spyOn(document.head, 'appendChild');
  });

  afterEach(() => {
    environment.production = originalProduction;
    appendSpy.mockRestore();
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  it('logs and aborts initialisation when analytics is disabled for non-production builds', () => {
    environment.production = false;
    const service = TestBed.inject(AnalyticsService);
    const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;

    service.initialize('G-TEST1234');

    expect(logger.info).toHaveBeenCalledWith('Analytics disabled in development mode', undefined, 'Analytics');
    expect(appendSpy).not.toHaveBeenCalled();
    expect((window as any).gtag).toBeUndefined();
  });

  it('bootstraps Google Analytics once enabled and forwards events to gtag', () => {
    environment.production = true;
    const service = TestBed.inject(AnalyticsService);
    const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;

    service.initialize('G-PRD12345');

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect((window as any).gtag).toBeInstanceOf(Function);
    expect((window as any).dataLayer).toBeDefined();
    expect(logger.info).toHaveBeenCalledWith('Analytics initialized', { trackingId: 'G-PRD12345' }, 'Analytics');

    service.trackPageView('/gallery', 'Gallery');
    service.trackEvent({ name: 'feature_usage', category: 'feature', action: 'activate', label: 'share' });

    const dataLayer: any[] = (window as any).dataLayer;
    expect(dataLayer.length).toBeGreaterThan(0);
  });

  it('queues events when disabled and flushes once re-enabled', () => {
    environment.production = true;
    const service = TestBed.inject(AnalyticsService);
    service.setEnabled(false);
    service.trackFeatureUsage('prompt enhancer', 'open');

    expect(service.getEventQueue()).toHaveLength(1);

    service.setEnabled(true);
    (window as any).gtag = jest.fn();
    service.initialize('G-FLUSH1');
    service.trackFeatureUsage('prompt enhancer', 'submit');

    expect(service.getEventQueue()).toHaveLength(2);
    expect((window as any).gtag).toHaveBeenCalled();
  });

  it('reuses existing gtag instance without injecting script twice', () => {
    environment.production = true;
    const service = TestBed.inject(AnalyticsService);
    const gtag = jest.fn();
    (window as any).gtag = gtag;

    service.initialize('G-EXISTING1');

    expect(gtag).toHaveBeenCalledWith('config', 'G-EXISTING1', { send_page_view: false });
    delete (window as any).gtag;
  });

  it('drops malformed events before they reach the queue', () => {
    environment.production = true;
    const service = TestBed.inject(AnalyticsService);
    const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;

    service.trackEvent({ name: '', category: 'c', action: 'a' });
    expect(logger.warn).toHaveBeenCalledWith('Invalid event name', expect.any(Object), 'Analytics');

    service.trackEvent({ name: 'n', category: '', action: 'a' });
    expect(logger.warn).toHaveBeenCalledWith('Invalid event category', expect.any(Object), 'Analytics');

    service.trackEvent({ name: 'n', category: 'c', action: '' });
    expect(logger.warn).toHaveBeenCalledWith('Invalid event action', expect.any(Object), 'Analytics');
  });
});
