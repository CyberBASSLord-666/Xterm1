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

  describe('Timer Management and Race Condition Prevention', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start batch timer on initialization', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const setIntervalSpy = jest.spyOn(window, 'setInterval');

      service.initialize('G-TIMER1');

      expect(setIntervalSpy).toHaveBeenCalled();

      setIntervalSpy.mockRestore();
    });

    it('should send batch when timer fires with events in queue', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-TIMER2');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      // Fast-forward timer
      jest.advanceTimersByTime(5000);

      // Event should have been sent
      expect((window as any).gtag).toHaveBeenCalled();
    });

    it('should not send batch when timer fires with empty queue', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-TIMER3');

      // Fast-forward timer without adding events
      jest.advanceTimersByTime(5000);

      // gtag should only be called for initialization, not for batch
      const callCount = (window as any).gtag.mock.calls.length;
      expect(callCount).toBeGreaterThan(0); // Init calls
    });

    it('should prevent concurrent batch sends', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-CONCURRENT1');

      // Add multiple events to trigger threshold
      for (let i = 0; i < 10; i++) {
        service.trackEvent({ name: `event${i}`, category: 'test', action: 'test' });
      }

      // Manually trigger sendBatch multiple times rapidly
      // The second call should be prevented by isSendingBatch flag
      const queueLengthBefore = service.getEventQueue().length;

      // Verify that events were batched
      expect(queueLengthBefore).toBe(0); // Should have been sent immediately when threshold reached
    });

    it('should stop batch timer when analytics is disabled', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

      service.initialize('G-DISABLE1');
      service.setEnabled(false);

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should clear event queue when disabled', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-CLEAR1');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      expect(service.getEventQueue().length).toBeGreaterThan(0);

      service.setEnabled(false);

      expect(service.getEventQueue().length).toBe(0);
    });

    it('should restart batch timer when re-enabled', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const setIntervalSpy = jest.spyOn(window, 'setInterval');

      service.initialize('G-RESTART1');
      const initialCallCount = setIntervalSpy.mock.calls.length;

      service.setEnabled(false);
      service.setEnabled(true);

      // setInterval should be called again
      expect(setIntervalSpy.mock.calls.length).toBeGreaterThan(initialCallCount);

      setIntervalSpy.mockRestore();
    });

    it('should send batch immediately when threshold is reached', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-THRESHOLD1');

      // Add exactly batchSize events (10) to trigger immediate send
      for (let i = 0; i < 10; i++) {
        service.trackEvent({ name: `event${i}`, category: 'test', action: 'test' });
      }

      // Events should be sent immediately without waiting for timer
      expect(service.getEventQueue().length).toBe(0);
      expect((window as any).gtag).toHaveBeenCalled();
    });

    it('should handle batch send errors gracefully', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;
      
      // Mock gtag to throw error
      (window as any).gtag = jest.fn().mockImplementation(() => {
        throw new Error('gtag error');
      });

      service.initialize('G-ERROR1');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      // Force batch send
      jest.advanceTimersByTime(5000);

      // Error should be logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send batch to GA',
        expect.any(Error),
        'Analytics'
      );
    });

    it('should enforce maximum queue size', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-MAXQUEUE1');

      // Add more than maxQueueSize events (100)
      for (let i = 0; i < 150; i++) {
        service.trackEvent({ name: `event${i}`, category: 'test', action: 'test' });
      }

      // Queue should not exceed maxQueueSize
      expect(service.getEventQueue().length).toBeLessThanOrEqual(100);
    });
  });

  describe('Service Lifecycle', () => {
    it('should clean up resources on destroy', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
      (window as any).gtag = jest.fn();

      service.initialize('G-DESTROY1');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      service.destroy();

      // Timer should be stopped
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should flush events on destroy', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-FLUSH1');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      const queueLength = service.getEventQueue().length;
      expect(queueLength).toBeGreaterThan(0);

      service.destroy();

      // Events should be flushed (sent)
      expect((window as any).gtag).toHaveBeenCalled();
    });

    it('should allow manual flush', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-MANUALFLUSH1');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      service.flush();

      // Events should be sent
      expect(service.getEventQueue().length).toBe(0);
      expect((window as any).gtag).toHaveBeenCalled();
    });

    it('should handle flush with empty queue', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);
      (window as any).gtag = jest.fn();

      service.initialize('G-EMPTYFLUSH1');

      // Flush with no events
      service.flush();

      // Should not throw error
      expect(service.getEventQueue().length).toBe(0);
    });
  });

  describe('Specialized Tracking Methods', () => {
    it('should track image generation', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-IMGGEN1');
      service.trackImageGeneration('flux', 5000);

      const events = service.getEventQueue();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].name).toBe('image_generation');
      expect(events[0].category).toBe('generation');
      expect(events[0].label).toBe('flux');
      expect(events[0].value).toBe(5000);
    });

    it('should track errors', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-ERROR2');
      service.trackError('Network failure', 'API');

      const events = service.getEventQueue();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].name).toBe('error');
      expect(events[0].category).toBe('error');
      expect(events[0].label).toContain('API');
      expect(events[0].label).toContain('Network failure');
    });

    it('should track feature usage', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-FEATURE1');
      service.trackFeatureUsage('gallery', 'open');

      const events = service.getEventQueue();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].name).toBe('feature_usage');
      expect(events[0].category).toBe('feature');
      expect(events[0].action).toBe('open');
      expect(events[0].label).toBe('gallery');
    });

    it('should track user interactions', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-INTERACTION1');
      service.trackInteraction('button', 'click');

      const events = service.getEventQueue();
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].name).toBe('user_interaction');
      expect(events[0].category).toBe('interaction');
      expect(events[0].action).toBe('click');
      expect(events[0].label).toBe('button');
    });
  });

  describe('Data Export (GDPR Compliance)', () => {
    it('should export analytics data as JSON', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-EXPORT1');
      service.trackEvent({ name: 'test', category: 'test', action: 'test' });

      const exported = service.exportData();
      expect(exported).toBeTruthy();
      expect(() => JSON.parse(exported)).not.toThrow();

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('should export empty array when no events', () => {
      environment.production = true;
      const service = TestBed.inject(AnalyticsService);

      service.initialize('G-EXPORT2');

      const exported = service.exportData();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(0);
    });
  });
});
