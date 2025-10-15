import { TestBed } from '@angular/core/testing';
import { PerformanceMonitorService } from '../performance-monitor.service';
import { LoggerService } from '../logger.service';

describe('PerformanceMonitorService', () => {
  class LoggerServiceStub {
    info = jest.fn();
    warn = jest.fn();
    error = jest.fn();
    debug = jest.fn();
  }

  class MockPerformanceObserver {
    static observers: Record<string, PerformanceObserverCallback> = {};

    constructor(private readonly callback: PerformanceObserverCallback) {}

    observe(options: PerformanceObserverInit): void {
      if (options.type) {
        MockPerformanceObserver.observers[options.type] = this.callback;
      }
    }

    disconnect(): void {}

    static trigger(type: string, entries: PerformanceEntry[]): void {
      const observer = MockPerformanceObserver.observers[type];
      if (observer) {
        observer({ getEntries: () => entries } as PerformanceObserverEntryList, {} as PerformanceObserver);
      }
    }

    static reset(): void {
      MockPerformanceObserver.observers = {};
    }
  }

  let service: PerformanceMonitorService;
  let logger: LoggerServiceStub;
  let nowSpy: jest.SpyInstance<number, []>;
  let originalGetEntriesByType: ((type: string) => PerformanceEntry[]) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    nowSpy = jest.spyOn(performance, 'now');
    (globalThis as any).PerformanceObserver = MockPerformanceObserver as unknown as typeof PerformanceObserver;
    originalGetEntriesByType = (performance as any).getEntriesByType;
    (performance as any).getEntriesByType = jest.fn();
    TestBed.configureTestingModule({
      providers: [PerformanceMonitorService, { provide: LoggerService, useClass: LoggerServiceStub }],
    });
    service = TestBed.inject(PerformanceMonitorService);
    logger = TestBed.inject(LoggerService) as unknown as LoggerServiceStub;
  });

  afterEach(() => {
    jest.useRealTimers();
    nowSpy.mockRestore();
    MockPerformanceObserver.reset();
    delete (globalThis as any).PerformanceObserver;
    if (originalGetEntriesByType) {
      (performance as any).getEntriesByType = originalGetEntriesByType;
    } else {
      delete (performance as any).getEntriesByType;
    }
  });

  it('measures async operations and records history', async () => {
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(120);
    const result = await service.measureAsync('AsyncOp', async () => 'done');

    expect(result).toBe('done');
    const history = service.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].duration).toBe(120);

    const stats = service.getStats('AsyncOp');
    expect(stats).toEqual({ count: 1, min: 120, max: 120, avg: 120 });
  });

  it('captures synchronous measurements and emits summaries', () => {
    nowSpy.mockReturnValueOnce(10).mockReturnValueOnce(30);
    const value = service.measureSync('SyncOp', () => 5);
    expect(value).toBe(5);

    service.logSummary();
    expect(logger.info).toHaveBeenCalledWith(
      'Performance Summary',
      expect.objectContaining({ activeMetrics: 0, completedMetrics: 1 }),
      'PerformanceMonitor'
    );
  });

  it('collects web vitals when PerformanceObserver is available', () => {
    const getEntriesMock = (performance as any).getEntriesByType as jest.Mock;
    getEntriesMock.mockImplementation((type: string) => {
      if (type === 'navigation') {
        return [{ responseStart: 120, requestStart: 20, domInteractive: 400, fetchStart: 0 }] as any;
      }
      if (type === 'paint') {
        return [{ name: 'first-contentful-paint', startTime: 1500 }] as any;
      }
      return [] as any;
    });

    const vitals = service.getWebVitals();

    MockPerformanceObserver.trigger('largest-contentful-paint', [{ renderTime: 2300 } as any]);
    MockPerformanceObserver.trigger('first-input', [{ startTime: 50, processingStart: 120 } as any]);
    MockPerformanceObserver.trigger('layout-shift', [
      { hadRecentInput: false, value: 0.08, startTime: 100 },
      { hadRecentInput: false, value: 0.03, startTime: 200 },
    ] as any);

    expect(vitals.fcp).toBe(1500);
    expect(vitals.ttfb).toBe(100);
    expect(vitals.tti).toBe(400);
    expect(vitals.lcp).toBe(2300);
    expect(vitals.fid).toBe(70);
    expect(vitals.cls).toBeGreaterThan(0.1);

    jest.spyOn(service, 'getWebVitals').mockReturnValue(vitals);
    const ratings = service.getWebVitalsRating();
    expect(ratings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ metric: 'LCP (Largest Contentful Paint)', rating: 'good' }),
        expect.objectContaining({ metric: 'FID (First Input Delay)', rating: 'good' }),
        expect.objectContaining({ metric: 'CLS (Cumulative Layout Shift)' }),
      ])
    );
  });

  it('gracefully handles browsers without PerformanceObserver support', () => {
    delete (globalThis as any).PerformanceObserver;
    const getEntriesMock = jest.fn().mockReturnValue([]);
    (performance as any).getEntriesByType = getEntriesMock;

    const vitals = service.getWebVitals();

    expect(vitals).toEqual({});
  });

  it('warns when ending unknown metrics and supports history management', () => {
    nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(150);
    service.measureSync('HistoryOp', () => 5);

    service.endMeasure('non-existent');
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Performance metric not found'),
      undefined,
      'PerformanceMonitor'
    );

    expect(service.getStats('missing')).toBeNull();

    service.clearHistory();
    expect(service.getHistory()).toEqual([]);
  });
});
