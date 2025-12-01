import {
  Injectable,
  NgZone,
  OnDestroy,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
  InjectionToken,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LoggerService } from './logger.service';

export interface FeedImageEvent {
  prompt: string;
  imageURL: string;
  model: string;
  seed?: number;
  width: number;
  height: number;
}

export interface FeedTextEvent {
  response: string;
  model: string;
  messages?: { role: string; content: string }[];
}

type FeedEvent = FeedImageEvent | FeedTextEvent;

export type FeedType = 'image' | 'text';

export type FeedStatus = 'idle' | 'connecting' | 'connected' | 'paused' | 'offline' | 'error' | 'reconnecting';

export interface FeedMetrics {
  received: number;
  dropped: number;
  skippedWhilePaused: number;
  buffered: number;
  reconnectAttempts: number;
  lastEventAt: number | null;
  eventsPerMinute: number;
  averageIntervalMs: number | null;
}

export type FeedHealth = 'idle' | 'good' | 'excellent' | 'degraded' | 'critical';

export interface FeedDiagnostics {
  uptimeMs: number;
  stalled: boolean;
  stallDurationMs: number;
  lastConnectedAt: number | null;
  lastDisconnectedAt: number | null;
  consecutiveErrors: number;
  lastFailureReason: 'error' | 'offline' | null;
  health: FeedHealth;
}

export interface TogglePauseResult {
  paused: boolean;
  flushed: number;
}

type TimerHandle = ReturnType<typeof setTimeout> | null;
type IntervalHandle = ReturnType<typeof setInterval> | null;

type EventSourceFactory = (url: string) => EventSource;

export const EVENT_SOURCE_FACTORY = new InjectionToken<EventSourceFactory>('REALTIME_FEED_EVENT_SOURCE_FACTORY', {
  providedIn: 'root',
  factory: () => (url: string) => new EventSource(url),
});

interface FeedConfig<TEvent extends FeedEvent> {
  url: string;
  maxItems: number;
  bufferLimit: number;
  dedupeKey: (event: TEvent) => string;
  validate: (value: unknown) => value is TEvent;
}

interface PausedEntry<TEvent extends FeedEvent> {
  key: string;
  payload: TEvent;
}

interface FeedState<TEvent extends FeedEvent> {
  readonly type: FeedType;
  readonly config: FeedConfig<TEvent>;
  readonly items: WritableSignal<TEvent[]>;
  readonly status: WritableSignal<FeedStatus>;
  readonly error: WritableSignal<string | null>;
  readonly metrics: WritableSignal<FeedMetrics>;
  readonly diagnostics: WritableSignal<FeedDiagnostics>;
  readonly paused: WritableSignal<boolean>;
  active: boolean;
  reconnectAttempt: number;
  reconnectTimer: TimerHandle;
  uptimeTimer: IntervalHandle;
  stallTimer: IntervalHandle;
  source: EventSource | null;
  seenKeys: Set<string>;
  pausedBuffer: PausedEntry<TEvent>[];
  pausedBufferKeys: Set<string>;
  eventTimestamps: number[];
  monitoringSuspendedForVisibility: boolean;
}

@Injectable({ providedIn: 'root' })
export class RealtimeFeedService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly ngZone = inject(NgZone);
  private readonly createEventSource = inject(EVENT_SOURCE_FACTORY);
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly isBrowser = typeof window !== 'undefined';
  private browserListenersAttached = false;
  private lastVisibilityState: DocumentVisibilityState | undefined;

  private readonly defaultMetrics: FeedMetrics = {
    received: 0,
    dropped: 0,
    skippedWhilePaused: 0,
    buffered: 0,
    reconnectAttempts: 0,
    lastEventAt: null,
    eventsPerMinute: 0,
    averageIntervalMs: null,
  };

  private readonly defaultDiagnostics: FeedDiagnostics = {
    uptimeMs: 0,
    stalled: false,
    stallDurationMs: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    consecutiveErrors: 0,
    lastFailureReason: null,
    health: 'idle',
  };

  private readonly monitorInterval = 5000;
  private readonly stallThreshold = 15000;
  private readonly criticalStallThreshold = 60000;
  private readonly excellentUptimeThreshold = 300000;
  private readonly eventRateWindowMs = 60000;

  private readonly imageConfig: FeedConfig<FeedImageEvent> = {
    url: 'https://image.pollinations.ai/feed',
    maxItems: 120,
    bufferLimit: 60,
    dedupeKey: (event) => `${event.imageURL}|${event.prompt}`,
    validate: (value: unknown): value is FeedImageEvent => {
      if (typeof value !== 'object' || value === null) return false;
      const candidate = value as Record<string, unknown>;
      return (
        typeof candidate.prompt === 'string' &&
        typeof candidate.imageURL === 'string' &&
        typeof candidate.model === 'string' &&
        typeof candidate.width === 'number' &&
        typeof candidate.height === 'number'
      );
    },
  };

  private readonly textConfig: FeedConfig<FeedTextEvent> = {
    url: 'https://text.pollinations.ai/feed',
    maxItems: 150,
    bufferLimit: 80,
    dedupeKey: (event) => `${event.model}|${event.response.slice(0, 120)}`,
    validate: (value: unknown): value is FeedTextEvent => {
      if (typeof value !== 'object' || value === null) return false;
      const candidate = value as Record<string, unknown>;
      return typeof candidate.response === 'string' && typeof candidate.model === 'string';
    },
  };

  private readonly states: {
    image: FeedState<FeedImageEvent>;
    text: FeedState<FeedTextEvent>;
  } = {
    image: this.createState('image', this.imageConfig),
    text: this.createState('text', this.textConfig),
  };

  private readonly statusSignals: Record<FeedType, Signal<FeedStatus>> = {
    image: computed(() => this.states.image.status()),
    text: computed(() => this.states.text.status()),
  };

  private readonly errorSignals: Record<FeedType, Signal<string | null>> = {
    image: computed(() => this.states.image.error()),
    text: computed(() => this.states.text.error()),
  };

  private readonly metricsSignals: Record<FeedType, Signal<FeedMetrics>> = {
    image: computed(() => this.states.image.metrics()),
    text: computed(() => this.states.text.metrics()),
  };

  private readonly diagnosticsSignals: Record<FeedType, Signal<FeedDiagnostics>> = {
    image: computed(() => this.states.image.diagnostics()),
    text: computed(() => this.states.text.diagnostics()),
  };

  private readonly healthSignals: Record<FeedType, Signal<FeedHealth>> = {
    image: computed(() => this.states.image.diagnostics().health),
    text: computed(() => this.states.text.diagnostics().health),
  };

  private readonly pausedSignals: Record<FeedType, Signal<boolean>> = {
    image: computed(() => this.states.image.paused()),
    text: computed(() => this.states.text.paused()),
  };

  private readonly onlineListener = () => this.handleOnline();
  private readonly offlineListener = () => this.handleOffline();
  private readonly visibilityChangeListener = () => this.handleVisibilityChange();

  private readonly maxReconnectDelay = 30_000;

  constructor() {
    this.ensureBrowserListeners();
  }

  get imageFeedItems(): Signal<FeedImageEvent[]> {
    return this.states.image.items.asReadonly();
  }

  get textFeedItems(): Signal<FeedTextEvent[]> {
    return this.states.text.items.asReadonly();
  }

  statusSignal(type: FeedType): Signal<FeedStatus> {
    return this.statusSignals[type];
  }

  errorSignal(type: FeedType): Signal<string | null> {
    return this.errorSignals[type];
  }

  metricsSignal(type: FeedType): Signal<FeedMetrics> {
    return this.metricsSignals[type];
  }

  diagnosticsSignal(type: FeedType): Signal<FeedDiagnostics> {
    return this.diagnosticsSignals[type];
  }

  healthSignal(type: FeedType): Signal<FeedHealth> {
    return this.healthSignals[type];
  }

  pausedSignal(type: FeedType): Signal<boolean> {
    return this.pausedSignals[type];
  }

  start(type: FeedType, options: { reset?: boolean } = {}): void {
    const state = this.getState(type);
    if (!this.isBrowser) {
      this.logger.warn('Realtime feed attempted to start in a non-browser environment.', undefined, 'RealtimeFeed');
      return;
    }

    this.ensureBrowserListeners();

    state.active = true;
    state.reconnectAttempt = 0;
    if (options.reset) {
      this.reset(type);
    }
    this.resetDiagnostics(state, { preserveHistory: true });
    if (state.paused()) {
      state.paused.set(false);
    }
    this.connect(state);
  }

  stop(type: FeedType, options: { keepItems?: boolean } = {}): void {
    const state = this.getState(type);
    state.active = false;
    this.disconnectSource(state);
    this.clearReconnect(state);
    state.status.set('idle');
    this.markDisconnected(state, 'manual');
    if (!options.keepItems) {
      this.reset(type, { clearItems: true, resetMetrics: false });
    } else {
      this.resetDiagnostics(state, { preserveHistory: true });
    }
  }

  restart(type: FeedType, options: { resetBackoff?: boolean; hardReset?: boolean } = {}): void {
    const state = this.getState(type);
    if (!this.isBrowser) return;
    if (!state.active) {
      state.active = true;
    }
    if (options.hardReset) {
      this.reset(type);
    }
    this.disconnectSource(state);
    this.clearReconnect(state);
    if (options.resetBackoff) {
      state.reconnectAttempt = 0;
    }
    this.markDisconnected(state, 'manual');
    this.resetDiagnostics(state, { preserveHistory: true });
    this.connect(state);
  }

  reset(type: FeedType, options: { clearItems?: boolean; resetMetrics?: boolean; clearError?: boolean } = {}): void {
    const state = this.getState(type);
    if (options.clearItems !== false) {
      state.items.set([]);
      state.seenKeys.clear();
    }
    state.pausedBuffer = [];
    state.pausedBufferKeys.clear();
    state.eventTimestamps = [];
    if (options.resetMetrics !== false) {
      state.metrics.set({ ...this.defaultMetrics });
    } else {
      this.updateMetrics(state, (metrics) => ({ ...metrics, buffered: 0 }));
    }
    if (options.clearError !== false) {
      state.error.set(null);
    }
    this.resetDiagnostics(state, { preserveHistory: true });
  }

  togglePause(type: FeedType): TogglePauseResult {
    const state = this.getState(type);
    const next = !state.paused();
    const flushed = this.setPausedState(state, next);
    return { paused: next, flushed };
  }

  setPaused(type: FeedType, paused: boolean): TogglePauseResult {
    const state = this.getState(type);
    const flushed = this.setPausedState(state, paused);
    return { paused, flushed };
  }

  shutdown(): void {
    this.stop('image', { keepItems: false });
    this.stop('text', { keepItems: false });
    this.removeBrowserListeners();
  }

  ngOnDestroy(): void {
    this.shutdown();
  }

  private createState<TEvent extends FeedEvent>(type: FeedType, config: FeedConfig<TEvent>): FeedState<TEvent> {
    const currentVisibility = this.document?.visibilityState as DocumentVisibilityState | undefined;
    const isHidden = this.isVisibilityHidden(currentVisibility);
    return {
      type,
      config,
      items: signal<TEvent[]>([]),
      status: signal<FeedStatus>('idle'),
      error: signal<string | null>(null),
      metrics: signal<FeedMetrics>({ ...this.defaultMetrics }),
      diagnostics: signal<FeedDiagnostics>({ ...this.defaultDiagnostics }),
      paused: signal(false),
      active: false,
      reconnectAttempt: 0,
      reconnectTimer: null,
      uptimeTimer: null,
      stallTimer: null,
      source: null,
      seenKeys: new Set<string>(),
      pausedBuffer: [],
      pausedBufferKeys: new Set<string>(),
      eventTimestamps: [],
      monitoringSuspendedForVisibility: isHidden,
    };
  }

  private getState<TEvent extends FeedEvent>(type: FeedType): FeedState<TEvent> {
    return type === 'image'
      ? (this.states.image as unknown as FeedState<TEvent>)
      : (this.states.text as unknown as FeedState<TEvent>);
  }

  private ensureBrowserListeners(): void {
    if (!this.isBrowser || this.browserListenersAttached) {
      return;
    }
    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
    if (this.document?.addEventListener) {
      this.document.addEventListener('visibilitychange', this.visibilityChangeListener);
      const visibility = (this.document.visibilityState as DocumentVisibilityState | undefined) ?? undefined;
      this.lastVisibilityState = visibility ?? 'visible';
    } else {
      this.lastVisibilityState = undefined;
    }
    this.browserListenersAttached = true;
  }

  private removeBrowserListeners(): void {
    if (!this.isBrowser || !this.browserListenersAttached) {
      return;
    }
    window.removeEventListener('online', this.onlineListener);
    window.removeEventListener('offline', this.offlineListener);
    if (this.document?.removeEventListener) {
      this.document.removeEventListener('visibilitychange', this.visibilityChangeListener);
    }
    this.lastVisibilityState = undefined;
    this.browserListenersAttached = false;
  }

  private connect<TEvent extends FeedEvent>(state: FeedState<TEvent>): void {
    if (!state.active) {
      this.logger.debug('Skipping connect because feed is not active.', undefined, 'RealtimeFeed');
      return;
    }

    this.disconnectSource(state);

    if (!this.isBrowser) {
      state.status.set('idle');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator && 'onLine' in navigator && !navigator.onLine) {
      state.status.set('offline');
      state.error.set('You are currently offline.');
      this.scheduleReconnect(state, 'offline');
      return;
    }

    try {
      state.status.set('connecting');
      state.error.set(null);
      const source = this.createEventSource(state.config.url);
      state.source = source;

      source.onopen = () => {
        this.ngZone.run(() => {
          state.status.set(state.paused() ? 'paused' : 'connected');
          state.reconnectAttempt = 0;
          const connectedAt = Date.now();
          this.updateDiagnostics(state, (diagnostics) => ({
            ...diagnostics,
            uptimeMs: 0,
            stalled: false,
            stallDurationMs: 0,
            lastConnectedAt: connectedAt,
            lastFailureReason: null,
            consecutiveErrors: 0,
          }));
          this.startMonitoring(state);
        });
      };

      source.onmessage = (event) => {
        this.ngZone.run(() => {
          this.handleMessage(state, event.data);
        });
      };

      source.onerror = (error) => {
        this.ngZone.run(() => {
          this.logger.error(`Realtime feed ${state.type} encountered an error`, error, 'RealtimeFeed');
          state.status.set('error');
          state.error.set('Feed connection lost. Attempting to reconnect...');
          this.disconnectSource(state);
          this.scheduleReconnect(state, 'error');
        });
      };
    } catch (error) {
      state.status.set('error');
      state.error.set('Failed to establish feed connection.');
      this.logger.error(`Failed to create EventSource for ${state.type}`, error, 'RealtimeFeed');
      this.scheduleReconnect(state, 'error');
    }
  }

  private handleMessage<TEvent extends FeedEvent>(state: FeedState<TEvent>, rawData: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData);
    } catch (error) {
      this.logger.warn(`Dropping non-JSON feed event for ${state.type}`, { rawData, error }, 'RealtimeFeed');
      this.updateMetrics(state, (metrics) => ({ ...metrics, dropped: metrics.dropped + 1 }));
      return;
    }

    if (!state.config.validate(parsed)) {
      this.logger.warn(`Dropping malformed feed event for ${state.type}`, parsed, 'RealtimeFeed');
      this.updateMetrics(state, (metrics) => ({ ...metrics, dropped: metrics.dropped + 1 }));
      return;
    }

    const event = parsed as TEvent;
    const key = state.config.dedupeKey(event);

    if (state.paused()) {
      this.enqueuePaused(state, key, event);
      return;
    }

    this.pushEvent(state, event, key);
  }

  private enqueuePaused<TEvent extends FeedEvent>(state: FeedState<TEvent>, key: string, event: TEvent): void {
    if (state.pausedBufferKeys.has(key) || state.seenKeys.has(key)) {
      this.updateMetrics(state, (metrics) => ({ ...metrics, dropped: metrics.dropped + 1 }));
      return;
    }

    if (state.pausedBuffer.length >= state.config.bufferLimit) {
      const removed = state.pausedBuffer.shift();
      if (removed) {
        state.pausedBufferKeys.delete(removed.key);
      }
    }

    state.pausedBuffer.push({ key, payload: event });
    state.pausedBufferKeys.add(key);
    this.updateMetrics(state, (metrics) => ({
      ...metrics,
      skippedWhilePaused: metrics.skippedWhilePaused + 1,
      buffered: state.pausedBuffer.length,
    }));
  }

  private pushEvent<TEvent extends FeedEvent>(state: FeedState<TEvent>, event: TEvent, key: string): void {
    if (state.seenKeys.has(key)) {
      this.updateMetrics(state, (metrics) => ({ ...metrics, dropped: metrics.dropped + 1 }));
      return;
    }

    state.seenKeys.add(key);
    state.items.update((items) => {
      const next = [event, ...items];
      if (next.length > state.config.maxItems) {
        const trimmed = next.slice(0, state.config.maxItems);
        for (let i = state.config.maxItems; i < next.length; i++) {
          const removed = next[i];
          const removedKey = state.config.dedupeKey(removed);
          state.seenKeys.delete(removedKey);
        }
        return trimmed;
      }
      return next;
    });

    const timestamp = Date.now();
    const { eventsPerMinute, averageIntervalMs } = this.recordEventTimestamp(state, timestamp);
    this.updateMetrics(state, (metrics) => ({
      ...metrics,
      received: metrics.received + 1,
      buffered: state.pausedBuffer.length,
      lastEventAt: timestamp,
      eventsPerMinute,
      averageIntervalMs,
    }));

    const diagnostics = state.diagnostics();
    if (diagnostics.stalled || diagnostics.stallDurationMs !== 0) {
      this.updateDiagnostics(state, (current) => ({
        ...current,
        stalled: false,
        stallDurationMs: 0,
      }));
    }
  }

  private setPausedState<TEvent extends FeedEvent>(state: FeedState<TEvent>, paused: boolean): number {
    if (state.paused() === paused) {
      return 0;
    }

    state.paused.set(paused);
    const diagnostics = state.diagnostics();

    if (paused) {
      state.status.set('paused');
      if (diagnostics.stalled || diagnostics.stallDurationMs !== 0) {
        this.updateDiagnostics(state, (current) => ({
          ...current,
          stalled: false,
          stallDurationMs: 0,
        }));
      }
      return 0;
    }

    const flushed = this.flushPaused(state);

    if (diagnostics.stalled || diagnostics.stallDurationMs !== 0) {
      this.updateDiagnostics(state, (current) => ({
        ...current,
        stalled: false,
        stallDurationMs: 0,
      }));
    }

    if (state.source) {
      state.status.set('connected');
    } else if (state.active) {
      this.connect(state);
    } else {
      state.status.set('idle');
    }

    return flushed;
  }

  private flushPaused<TEvent extends FeedEvent>(state: FeedState<TEvent>): number {
    if (state.pausedBuffer.length === 0) {
      return 0;
    }

    let flushed = 0;
    for (const entry of state.pausedBuffer) {
      if (!state.seenKeys.has(entry.key)) {
        this.pushEvent(state, entry.payload, entry.key);
        flushed += 1;
      }
    }

    state.pausedBuffer = [];
    state.pausedBufferKeys.clear();
    this.updateMetrics(state, (metrics) => ({ ...metrics, buffered: 0 }));
    return flushed;
  }

  private disconnectSource<TEvent extends FeedEvent>(state: FeedState<TEvent>): void {
    if (state.source) {
      state.source.close();
      state.source = null;
    }
    this.stopMonitoring(state);
  }

  private clearReconnect<TEvent extends FeedEvent>(state: FeedState<TEvent>): void {
    if (state.reconnectTimer !== null) {
      clearTimeout(state.reconnectTimer as ReturnType<typeof setTimeout>);
      state.reconnectTimer = null;
    }
  }

  private scheduleReconnect<TEvent extends FeedEvent>(state: FeedState<TEvent>, reason: 'offline' | 'error'): void {
    if (!state.active) {
      return;
    }

    this.clearReconnect(state);

    state.reconnectAttempt += 1;
    const attempt = state.reconnectAttempt;
    const backoff = Math.min(1000 * Math.pow(2, attempt), this.maxReconnectDelay);
    const jitter = Math.floor(Math.random() * 500);
    const delay = Math.min(backoff + jitter, this.maxReconnectDelay);

    this.updateMetrics(state, (metrics) => ({
      ...metrics,
      reconnectAttempts: metrics.reconnectAttempts + 1,
    }));

    state.status.set('reconnecting');
    this.markDisconnected(state, reason === 'offline' ? 'offline' : 'error');

    this.logger.warn(
      `Scheduling realtime feed reconnect for ${state.type} in ${delay}ms`,
      { attempt, reason },
      'RealtimeFeed'
    );

    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = null;
      this.connect(state);
    }, delay);
  }

  private resetDiagnostics<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    options: { preserveHistory?: boolean } = {}
  ): void {
    const current = state.diagnostics();
    const base = options.preserveHistory
      ? {
          ...this.defaultDiagnostics,
          lastConnectedAt: current.lastConnectedAt,
          lastDisconnectedAt: current.lastDisconnectedAt,
          consecutiveErrors: current.consecutiveErrors,
          lastFailureReason: current.lastFailureReason,
        }
      : { ...this.defaultDiagnostics };

    const normalized: FeedDiagnostics = {
      ...base,
      health: this.determineHealth(state, base),
    };
    state.diagnostics.set(normalized);
  }

  private updateDiagnostics<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    updater: (diagnostics: FeedDiagnostics) => FeedDiagnostics
  ): void {
    state.diagnostics.update((diagnostics) => {
      const next = updater(diagnostics);
      return {
        ...next,
        health: this.determineHealth(state, next),
      };
    });
  }

  private determineHealth<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    diagnostics: FeedDiagnostics
  ): FeedHealth {
    const status = state.status();

    if (status === 'idle') {
      return diagnostics.lastConnectedAt ? 'good' : 'idle';
    }

    if (status === 'error') {
      return 'critical';
    }

    if (status === 'offline') {
      return 'critical';
    }

    if (diagnostics.lastFailureReason === 'error') {
      return 'critical';
    }

    if (diagnostics.lastFailureReason === 'offline') {
      return 'critical';
    }

    if (status === 'reconnecting') {
      return diagnostics.consecutiveErrors > 0 ? 'critical' : 'degraded';
    }

    if (diagnostics.stalled) {
      return diagnostics.stallDurationMs >= this.criticalStallThreshold ? 'critical' : 'degraded';
    }

    if (state.paused() || status === 'paused') {
      return 'good';
    }

    if (status === 'connecting') {
      return diagnostics.consecutiveErrors > 0 ? 'degraded' : 'good';
    }

    if (status === 'connected') {
      if (diagnostics.uptimeMs >= this.excellentUptimeThreshold && diagnostics.consecutiveErrors === 0) {
        return 'excellent';
      }
      return 'good';
    }

    return 'good';
  }

  private recordEventTimestamp<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    timestamp: number
  ): { eventsPerMinute: number; averageIntervalMs: number | null } {
    state.eventTimestamps.push(timestamp);
    const windowStart = timestamp - this.eventRateWindowMs;
    while (state.eventTimestamps.length > 0 && state.eventTimestamps[0] < windowStart) {
      state.eventTimestamps.shift();
    }

    const eventsInWindow = state.eventTimestamps.length;
    const eventsPerMinute = eventsInWindow === 0 ? 0 : (eventsInWindow / this.eventRateWindowMs) * 60000;

    if (state.eventTimestamps.length < 2) {
      return { eventsPerMinute, averageIntervalMs: null };
    }

    let totalInterval = 0;
    for (let i = 1; i < state.eventTimestamps.length; i += 1) {
      totalInterval += state.eventTimestamps[i] - state.eventTimestamps[i - 1];
    }
    const averageIntervalMs = totalInterval / (state.eventTimestamps.length - 1);

    return { eventsPerMinute, averageIntervalMs };
  }

  private startMonitoring<TEvent extends FeedEvent>(state: FeedState<TEvent>): void {
    if (!this.isBrowser) {
      return;
    }

    this.stopMonitoring(state);

    if (this.isVisibilityHidden(this.lastVisibilityState)) {
      state.monitoringSuspendedForVisibility = true;
      const diagnostics = state.diagnostics();
      if (diagnostics.stalled || diagnostics.stallDurationMs !== 0) {
        this.updateDiagnostics(state, (snapshot) => ({
          ...snapshot,
          stalled: false,
          stallDurationMs: 0,
        }));
      }
      return;
    }

    state.monitoringSuspendedForVisibility = false;

    this.ngZone.runOutsideAngular(() => {
      state.uptimeTimer = window.setInterval(() => {
        this.ngZone.run(() => {
          const diagnostics = state.diagnostics();
          if (!diagnostics.lastConnectedAt) {
            return;
          }
          const uptime = Date.now() - diagnostics.lastConnectedAt;
          if (diagnostics.uptimeMs !== uptime) {
            this.updateDiagnostics(state, (current) => ({
              ...current,
              uptimeMs: uptime,
            }));
          }
        });
      }, this.monitorInterval) as unknown as IntervalHandle;

      state.stallTimer = window.setInterval(() => {
        this.ngZone.run(() => {
          if (state.paused()) {
            const current = state.diagnostics();
            if (current.stalled || current.stallDurationMs !== 0) {
              this.updateDiagnostics(state, (snapshot) => ({
                ...snapshot,
                stalled: false,
                stallDurationMs: 0,
              }));
            }
            return;
          }

          const metrics = state.metrics();
          const diagnostics = state.diagnostics();
          const reference = metrics.lastEventAt ?? diagnostics.lastConnectedAt;
          if (!reference) {
            return;
          }

          const duration = Date.now() - reference;
          const stalled = duration >= this.stallThreshold;
          const previous = state.diagnostics();
          if (!stalled && !previous.stalled) {
            return;
          }
          if (stalled && previous.stalled && Math.abs(previous.stallDurationMs - duration) < this.monitorInterval / 2) {
            return;
          }
          this.updateDiagnostics(state, (current) => ({
            ...current,
            stalled,
            stallDurationMs: stalled ? duration : 0,
          }));
        });
      }, this.monitorInterval) as unknown as IntervalHandle;
    });
  }

  private stopMonitoring<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    options: { preserveVisibilitySuspended?: boolean } = {}
  ): void {
    if (!options.preserveVisibilitySuspended) {
      state.monitoringSuspendedForVisibility = false;
    }
    if (state.uptimeTimer !== null) {
      clearInterval(state.uptimeTimer as ReturnType<typeof setInterval>);
      state.uptimeTimer = null;
    }
    if (state.stallTimer !== null) {
      clearInterval(state.stallTimer as ReturnType<typeof setInterval>);
      state.stallTimer = null;
    }
  }

  private pauseMonitoringForHiddenDocument<TEvent extends FeedEvent>(state: FeedState<TEvent>): void {
    if (state.monitoringSuspendedForVisibility || !this.isBrowser) {
      return;
    }
    state.monitoringSuspendedForVisibility = true;
    this.stopMonitoring(state, { preserveVisibilitySuspended: true });
    const diagnostics = state.diagnostics();
    if (diagnostics.stalled || diagnostics.stallDurationMs !== 0) {
      this.updateDiagnostics(state, (current) => ({
        ...current,
        stalled: false,
        stallDurationMs: 0,
      }));
    }
  }

  private resumeMonitoringAfterVisibility<TEvent extends FeedEvent>(state: FeedState<TEvent>): void {
    if (!state.monitoringSuspendedForVisibility) {
      return;
    }
    state.monitoringSuspendedForVisibility = false;
    if (!state.active || !state.source) {
      return;
    }
    const status = state.status();
    if (status === 'connected' || status === 'paused' || status === 'connecting') {
      this.startMonitoring(state);
    }
  }

  private isVisibilityHidden(visibility: DocumentVisibilityState | undefined): boolean {
    return visibility !== undefined && visibility !== 'visible';
  }

  private handleVisibilityChange(): void {
    if (!this.isBrowser || !this.document) {
      return;
    }

    const visibility = (this.document.visibilityState as DocumentVisibilityState | undefined) ?? 'visible';
    if (visibility === this.lastVisibilityState) {
      return;
    }
    this.lastVisibilityState = visibility;

    if (this.isVisibilityHidden(visibility)) {
      (['image', 'text'] as FeedType[]).forEach((type) => {
        const state = this.getState(type);
        if (!state.active) {
          return;
        }
        this.logger.info(
          `Document hidden. Suspending realtime monitoring for ${type} feed.`,
          undefined,
          'RealtimeFeed'
        );
        this.pauseMonitoringForHiddenDocument(state);
      });
      return;
    }

    if (visibility === 'visible') {
      (['image', 'text'] as FeedType[]).forEach((type) => {
        const state = this.getState(type);
        if (!state.active || !state.monitoringSuspendedForVisibility) {
          return;
        }
        this.logger.info(`Document visible. Resuming realtime monitoring for ${type} feed.`, undefined, 'RealtimeFeed');
        this.resumeMonitoringAfterVisibility(state);
      });
    }
  }

  private markDisconnected<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    reason: 'manual' | 'error' | 'offline'
  ): void {
    if (reason !== 'manual') {
      this.stopMonitoring(state);
    }
    const failureReason = reason === 'manual' ? null : reason;
    const disconnectedAt = Date.now();
    this.updateDiagnostics(state, (diagnostics) => ({
      ...diagnostics,
      lastDisconnectedAt: disconnectedAt,
      stalled: false,
      stallDurationMs: 0,
      uptimeMs: reason === 'manual' ? 0 : diagnostics.uptimeMs,
      consecutiveErrors: reason === 'error' ? diagnostics.consecutiveErrors + 1 : diagnostics.consecutiveErrors,
      lastFailureReason: failureReason,
    }));
  }

  private updateMetrics<TEvent extends FeedEvent>(
    state: FeedState<TEvent>,
    updater: (metrics: FeedMetrics) => FeedMetrics
  ): void {
    state.metrics.update(updater);
  }

  private handleOnline(): void {
    (['image', 'text'] as FeedType[]).forEach((type) => {
      const state = this.getState(type);
      if (!state.active) {
        return;
      }

      if (state.status() === 'offline' || state.status() === 'error') {
        this.logger.info(`Browser is back online. Restarting ${type} feed.`, undefined, 'RealtimeFeed');
        state.reconnectAttempt = 0;
        this.connect(state);
      }
    });
  }

  private handleOffline(): void {
    (['image', 'text'] as FeedType[]).forEach((type) => {
      const state = this.getState(type);
      if (!state.active) {
        return;
      }

      this.logger.warn(`Browser went offline. Halting ${type} feed.`, undefined, 'RealtimeFeed');
      this.disconnectSource(state);
      this.clearReconnect(state);
      state.status.set('offline');
      state.error.set('Waiting for network connection...');
      this.markDisconnected(state, 'offline');
    });
  }
}
