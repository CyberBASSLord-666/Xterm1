import { TestBed } from '@angular/core/testing';
import { RealtimeFeedService, EVENT_SOURCE_FACTORY, FeedImageEvent } from '../realtime-feed.service';
import { LoggerService } from '../logger.service';

class StubLoggerService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  debug(_message: string, _data?: unknown, _source?: string): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info(_message: string, _data?: unknown, _source?: string): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  warn(_message: string, _data?: unknown, _source?: string): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error(_message: string, _error?: unknown, _source?: string): void {}
}

class MockEventSource {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState = 0;
  withCredentials = false;
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  close = (): void => {
    this.readyState = 2;
  };

  emitOpen = (): void => {
    this.onopen?.(new Event('open'));
  };

  emitMessage = (data: unknown): void => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.onmessage?.({ data: payload } as MessageEvent<string>);
  };

  emitRaw = (data: string): void => {
    this.onmessage?.({ data } as MessageEvent<string>);
  };

  emitError = (): void => {
    this.onerror?.(new Event('error'));
  };
}

describe('RealtimeFeedService', () => {
  let service: RealtimeFeedService;
  let sources: Map<'image' | 'text', MockEventSource>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    sources = new Map();

    TestBed.configureTestingModule({
      providers: [
        RealtimeFeedService,
        { provide: LoggerService, useClass: StubLoggerService },
        {
          provide: EVENT_SOURCE_FACTORY,
          useFactory: () => (url: string) => {
            const source = new MockEventSource(url);
            const type = url.includes('image') ? 'image' : 'text';
            sources.set(type, source);
            return source as unknown as EventSource;
          },
        },
      ],
    });

    service = TestBed.inject(RealtimeFeedService);
  });

  afterEach(() => {
    service.shutdown();
    jest.useRealTimers();
  });

  function emitImage(
    event: Partial<FeedImageEvent> & Pick<FeedImageEvent, 'prompt' | 'imageURL' | 'model' | 'width' | 'height'>
  ): void {
    const source = sources.get('image');
    if (!source) {
      throw new Error('Image feed not initialized');
    }
    source.emitMessage({
      prompt: event.prompt,
      imageURL: event.imageURL,
      model: event.model,
      width: event.width,
      height: event.height,
      seed: event.seed,
    });
  }

  it('connects and streams image events', () => {
    service.start('image', { reset: true });
    const source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    emitImage({
      prompt: 'Hyper-detailed nebula skyline',
      imageURL: 'https://example.com/image-1.jpg',
      model: 'flux',
      width: 1024,
      height: 1536,
    });

    expect(service.statusSignal('image')()).toBe('connected');
    expect(service.imageFeedItems().length).toBe(1);
    expect(service.metricsSignal('image')().received).toBe(1);
    expect(service.metricsSignal('image')().dropped).toBe(0);
    expect(service.metricsSignal('image')().eventsPerMinute).toBeGreaterThan(0);
    expect(service.metricsSignal('image')().averageIntervalMs).toBeNull();
    expect(service.healthSignal('image')()).toBe('good');
  });

  it('buffers events while paused and flushes when resumed', () => {
    service.start('image', { reset: true });
    const source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    emitImage({
      prompt: 'Initial scene',
      imageURL: 'https://example.com/base.jpg',
      model: 'flux',
      width: 1024,
      height: 1536,
    });

    const pauseResult = service.togglePause('image');
    expect(pauseResult.paused).toBe(true);
    expect(service.metricsSignal('image')().buffered).toBe(0);

    emitImage({
      prompt: 'Buffered scene',
      imageURL: 'https://example.com/buffer.jpg',
      model: 'flux',
      width: 1024,
      height: 1536,
    });

    expect(service.imageFeedItems().length).toBe(1);
    expect(service.metricsSignal('image')().buffered).toBe(1);
    expect(service.metricsSignal('image')().skippedWhilePaused).toBe(1);

    const resumeResult = service.togglePause('image');
    expect(resumeResult.paused).toBe(false);
    expect(resumeResult.flushed).toBe(1);
    expect(service.imageFeedItems().length).toBe(2);
    expect(service.metricsSignal('image')().buffered).toBe(0);
  });

  it('deduplicates repeated events and tracks drops', () => {
    service.start('image', { reset: true });
    const source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    const payload: FeedImageEvent = {
      prompt: 'Aurora over frozen lake',
      imageURL: 'https://example.com/dedupe.jpg',
      model: 'flux',
      width: 1024,
      height: 1536,
    };

    emitImage(payload);
    emitImage(payload);

    expect(service.imageFeedItems().length).toBe(1);
    expect(service.metricsSignal('image')().received).toBe(1);
    expect(service.metricsSignal('image')().dropped).toBe(1);
  });

  it('tracks stall diagnostics and health transitions', () => {
    service.start('image', { reset: true });
    const source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    expect(service.healthSignal('image')()).toBe('good');

    jest.advanceTimersByTime(16000);

    const diagnosticsAfterStall = service.diagnosticsSignal('image')();
    expect(diagnosticsAfterStall.stalled).toBe(true);
    expect(service.healthSignal('image')()).toBe('degraded');

    emitImage({
      prompt: 'Recovery scene',
      imageURL: 'https://example.com/recovery.jpg',
      model: 'flux',
      width: 1024,
      height: 1536,
    });

    jest.advanceTimersByTime(10);
    const diagnosticsAfterRecovery = service.diagnosticsSignal('image')();
    expect(diagnosticsAfterRecovery.stalled).toBe(false);
    expect(service.healthSignal('image')()).toBe('good');
  });

  it('marks health critical after errors until reconnection succeeds', () => {
    service.start('image', { reset: true });
    let source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    source?.emitError();

    expect(service.healthSignal('image')()).toBe('critical');

    jest.advanceTimersByTime(4000);

    source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    expect(service.healthSignal('image')()).toBe('good');
    expect(service.diagnosticsSignal('image')().consecutiveErrors).toBe(0);
  });

  it('re-registers browser listeners after shutdown so offline/online transitions recover feeds', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const docAddSpy = jest.spyOn(document, 'addEventListener');
    const docRemoveSpy = jest.spyOn(document, 'removeEventListener');

    service.start('image', { reset: true });
    let source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    service.shutdown();

    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(docRemoveSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    addSpy.mockClear();
    docAddSpy.mockClear();

    service.start('image', { reset: true });
    source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(docAddSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

    window.dispatchEvent(new Event('offline'));

    expect(service.statusSignal('image')()).toBe('offline');
    expect(service.errorSignal('image')()).toContain('Waiting for network connection');

    window.dispatchEvent(new Event('online'));

    source = sources.get('image');
    expect(source).toBeDefined();
    source?.emitOpen();

    expect(service.statusSignal('image')()).toBe('connected');
    expect(service.errorSignal('image')()).toBeNull();

    addSpy.mockRestore();
    removeSpy.mockRestore();
    docAddSpy.mockRestore();
    docRemoveSpy.mockRestore();
  });

  it('suspends stall monitoring while document is hidden and resumes when visible', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    let visibilityState: DocumentVisibilityState = 'visible';

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });

    try {
      service.start('image', { reset: true });
      const source = sources.get('image');
      expect(source).toBeDefined();
      source?.emitOpen();

      emitImage({
        prompt: 'Visibility baseline',
        imageURL: 'https://example.com/visibility-baseline.jpg',
        model: 'flux',
        width: 1024,
        height: 1536,
      });

      jest.advanceTimersByTime(4000);

      visibilityState = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));

      jest.advanceTimersByTime(60000);

      expect(service.diagnosticsSignal('image')().stalled).toBe(false);

      visibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));

      jest.advanceTimersByTime(5000);

      expect(service.diagnosticsSignal('image')().stalled).toBe(true);

      emitImage({
        prompt: 'Visibility recovery',
        imageURL: 'https://example.com/visibility-recovery.jpg',
        model: 'flux',
        width: 1024,
        height: 1536,
      });

      expect(service.diagnosticsSignal('image')().stalled).toBe(false);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(document, 'visibilityState', originalDescriptor);
      } else {
        delete (document as { visibilityState?: string }).visibilityState;
      }
    }
  });

  it('skips stall monitoring when the document is hidden before the feed connects', () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    let visibilityState = 'hidden';

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState as DocumentVisibilityState,
    });

    const internalState = service as unknown as { lastVisibilityState?: DocumentVisibilityState };
    const previousVisibility = internalState.lastVisibilityState;
    internalState.lastVisibilityState = 'hidden';

    try {
      service.start('image', { reset: true });
      const source = sources.get('image');
      expect(source).toBeDefined();
      source?.emitOpen();

      jest.advanceTimersByTime(60000);

      expect(service.diagnosticsSignal('image')().stalled).toBe(false);

      visibilityState = 'prerender';
      document.dispatchEvent(new Event('visibilitychange'));

      jest.advanceTimersByTime(60000);

      expect(service.diagnosticsSignal('image')().stalled).toBe(false);

      visibilityState = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));

      jest.advanceTimersByTime(5000);

      expect(service.diagnosticsSignal('image')().stalled).toBe(true);
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(document, 'visibilityState', originalDescriptor);
      } else {
        delete (document as { visibilityState?: string }).visibilityState;
      }
      internalState.lastVisibilityState = previousVisibility;
    }
  });
});
