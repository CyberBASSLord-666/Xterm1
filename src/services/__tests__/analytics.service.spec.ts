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

  describe('trackImageGeneration', () => {
    it('should track image generation events', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.trackImageGeneration('flux', 5000);

      const events = service.getEventQueue();
      expect(events.length).toBeGreaterThan(0);
      const lastEvent = events[events.length - 1];
      expect(lastEvent.name).toBe('image_generation');
      expect(lastEvent.category).toBe('generation');
      expect(lastEvent.label).toBe('flux');
      expect(lastEvent.value).toBe(5000);
    });
  });

  describe('trackError', () => {
    it('should track error events', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.trackError('Network error', 'API');

      const events = service.getEventQueue();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.name).toBe('error');
      expect(lastEvent.category).toBe('error');
      expect(lastEvent.label).toBe('API: Network error');
    });
  });

  describe('trackInteraction', () => {
    it('should track user interaction events', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.trackInteraction('button', 'click');

      const events = service.getEventQueue();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.name).toBe('user_interaction');
      expect(lastEvent.category).toBe('interaction');
      expect(lastEvent.label).toBe('button');
    });
  });

  describe('clearEventQueue', () => {
    it('should clear the event queue', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.trackFeatureUsage('test', 'action');
      expect(service.getEventQueue().length).toBeGreaterThan(0);

      service.clearEventQueue();
      expect(service.getEventQueue()).toHaveLength(0);
    });
  });

  describe('flush', () => {
    it('should flush events when gtag is available', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const gtag = jest.fn();
      (window as any).gtag = gtag;

      service.setEnabled(true);
      service.trackFeatureUsage('test', 'action');
      service.flush();

      // Events should be processed
      expect(gtag).toHaveBeenCalled();
    });

    it('should not flush when queue is empty', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;

      service.clearEventQueue();
      service.flush();

      // Should not log flush message when queue is empty
      expect(logger.debug).not.toHaveBeenCalledWith('Flushing analytics queue', expect.any(Object), 'Analytics');
    });
  });

  describe('destroy', () => {
    it('should stop timer and flush events', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const gtag = jest.fn();
      (window as any).gtag = gtag;

      service.setEnabled(true);
      service.trackFeatureUsage('test', 'action');
      service.destroy();

      // Should have called gtag to flush
      expect(gtag).toHaveBeenCalled();
    });
  });

  describe('exportData', () => {
    it('should export event queue as JSON', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.trackFeatureUsage('test', 'action');

      const exported = service.exportData();
      const parsed = JSON.parse(exported);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('setEnabled', () => {
    it('should enable analytics and start batch timer', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;

      service.setEnabled(false);
      service.setEnabled(true);

      expect(logger.info).toHaveBeenCalledWith('Analytics enabled', undefined, 'Analytics');
    });

    it('should disable analytics and stop batch timer', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;

      service.setEnabled(true);
      service.setEnabled(false);

      expect(logger.info).toHaveBeenCalledWith('Analytics disabled', undefined, 'Analytics');
    });

    it('should clear event queue when disabled', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.setEnabled(true);
      service.trackFeatureUsage('test', 'action');
      expect(service.getEventQueue().length).toBeGreaterThan(0);

      service.setEnabled(false);
      expect(service.getEventQueue()).toHaveLength(0);
    });
  });

  describe('batch sending', () => {
    it('should send batch when queue size threshold reached', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const gtag = jest.fn();
      (window as any).gtag = gtag;

      service.setEnabled(true);

      // Add 10+ events to trigger batch send
      for (let i = 0; i < 12; i++) {
        service.trackFeatureUsage(`test-${i}`, 'action');
      }

      // Batch should have been sent
      expect(gtag).toHaveBeenCalled();
    });

    it('should handle metadata in events', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const gtag = jest.fn();
      (window as any).gtag = gtag;

      service.setEnabled(true);
      service.trackEvent({
        name: 'test',
        category: 'cat',
        action: 'act',
        metadata: { custom: 'value' },
      });

      // Force flush to send the event
      service.flush();

      expect(gtag).toHaveBeenCalledWith('event', 'act', expect.objectContaining({ custom: 'value' }));
    });
  });

  describe('trackPageView', () => {
    it('should track page view with title', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const gtag = jest.fn();
      (window as any).gtag = gtag;

      service.setEnabled(true);
      service.trackPageView('/test', 'Test Page');

      expect(gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_path: '/test',
          page_title: 'Test Page',
        })
      );
    });

    it('should use document title when no title provided', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const gtag = jest.fn();
      (window as any).gtag = gtag;

      service.setEnabled(true);
      service.trackPageView('/test');

      expect(gtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_path: '/test',
          page_title: document.title,
        })
      );
    });
  });
});
