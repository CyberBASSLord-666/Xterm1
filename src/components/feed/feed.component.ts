import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { PlatformService } from '../../services/platform.service';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { NgClass } from '@angular/common';
import {
  RealtimeFeedService,
  FeedType,
  FeedStatus,
  FeedMetrics,
  FeedDiagnostics,
  FeedHealth,
} from '../../services/realtime-feed.service';

const CLOCK_UPDATE_INTERVAL_MS = 1000;
const JUST_NOW_THRESHOLD_MS = 5000;

@Component({
  selector: 'pw-feed',
  standalone: true,
  templateUrl: './feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent, NgClass],
})
export class FeedComponent implements OnInit, OnDestroy {
  private readonly toast = inject(ToastService);
  private readonly feed = inject(RealtimeFeedService);

  feedMode = signal<FeedType>('image');
  private readonly now = signal(Date.now());

  readonly imageFeedItems = this.feed.imageFeedItems;
  readonly textFeedItems = this.feed.textFeedItems;

  private readonly statusLabels: Record<FeedStatus, string> = {
    idle: 'Idle',
    connecting: 'Connecting',
    connected: 'Live',
    paused: 'Paused',
    offline: 'Offline',
    error: 'Error',
    reconnecting: 'Reconnecting',
  };

  ngOnInit(): void {
    if (!this.platformService.isBrowser) {
      return; // Skip EventSource initialization in SSR
    }
    this.connectImageFeed();
  }

  connectImageFeed(): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    this.imageEventSource?.close();
    this.imageEventSource = new EventSource('https://image.pollinations.ai/feed');

    this.imageEventSource.onopen = (): void => {
      // Reset delay on successful connection
      this.imageReconnectDelay = 2000;
    };

    this.imageEventSource.onmessage = (event): void => {
      if (!event.data || this.feedMode() !== 'image' || this.isPaused()) return;
      try {
        const data: FeedImageEvent = JSON.parse(event.data);
        this.feedItems.update((list) => [data, ...list.slice(0, 99)]); // Keep list to 100 items
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Non-JSON image feed event:', event.data);
      }
    };

  readonly activeMetrics = computed<FeedMetrics>(() => {
    const mode = this.feedMode();
    return this.feed.metricsSignal(mode)();
  });

  readonly activeDiagnostics = computed<FeedDiagnostics>(() => {
    const mode = this.feedMode();
    return this.feed.diagnosticsSignal(mode)();
  });

  readonly connectionHealth = computed<FeedHealth>(() => {
    const mode = this.feedMode();
    return this.feed.healthSignal(mode)();
  });

  readonly isPaused = computed(() => {
    const mode = this.feedMode();
    return this.feed.pausedSignal(mode)();
  });

  readonly activeStatusLabel = computed(() => this.statusLabels[this.activeStatus()]);

  readonly activeStatusClasses = computed(() => {
    switch (this.activeStatus()) {
      case 'connected':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'connecting':
      case 'reconnecting':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'paused':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
      case 'offline':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/30';
      case 'error':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
      case 'idle':
      default:
        return 'bg-secondary-bg text-secondary-text border-primary-border';
    }
  });

  readonly lastUpdatedLabel = computed(() => {
    const last = this.activeMetrics().lastEventAt;
    if (!last) {
      return 'No events yet';
    }
    const diff = this.now() - last;
    const relative = this.formatRelative(diff);
    return relative === 'Just now' ? relative : `${relative} ago`;
  });

  readonly pauseButtonLabel = computed(() => (this.isPaused() ? 'Resume' : 'Pause'));

  private readonly healthLabels: Record<FeedHealth, string> = {
    idle: 'Idle',
    good: 'Healthy',
    excellent: 'Excellent',
    degraded: 'Degraded',
    critical: 'Critical',
  };

  private readonly healthClasses: Record<FeedHealth, string> = {
    idle: 'bg-secondary-bg text-secondary-text border-primary-border',
    good: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    excellent: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    degraded: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    critical: 'bg-rose-500/10 text-rose-200 border-rose-500/30',
  };

  readonly healthBadgeLabel = computed(() => this.healthLabels[this.connectionHealth()]);

  readonly healthBadgeClasses = computed(() => this.healthClasses[this.connectionHealth()]);

  readonly uptimeLabel = computed(() => this.formatDuration(this.activeDiagnostics().uptimeMs));

  readonly stallDurationLabel = computed(() =>
    this.activeDiagnostics().stalled ? this.formatDuration(this.activeDiagnostics().stallDurationMs) : '—'
  );

  readonly eventsPerMinuteLabel = computed(() => {
    const rate = this.activeMetrics().eventsPerMinute;
    if (rate <= 0) {
      return '—';
    }
    return rate >= 10 ? rate.toFixed(0) : rate.toFixed(1);
  });

  readonly averageIntervalLabel = computed(() => {
    const interval = this.activeMetrics().averageIntervalMs;
    if (interval === null) {
      return '—';
    }
    return this.formatDuration(interval);
  });

  readonly lastFailureLabel = computed(() => {
    const diagnostics = this.activeDiagnostics();
    if (!diagnostics.lastFailureReason) {
      return 'None';
    }
    const base = diagnostics.lastFailureReason === 'error' ? 'Error' : 'Offline';
    if (!diagnostics.lastDisconnectedAt) {
      return base;
    }
    const diff = this.now() - diagnostics.lastDisconnectedAt;
    const relative = this.formatRelative(diff);
    return `${base} · ${relative}${relative === 'Just now' ? '' : ' ago'}`;
  });

  private readonly wasStalled = signal(false);
  private readonly previousHealth = signal<FeedHealth>('idle');

  connectTextFeed(): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    this.textEventSource?.close();
    this.textEventSource = new EventSource('https://text.pollinations.ai/feed');

    this.textEventSource.onopen = (): void => {
      // Reset delay on successful connection
      this.textReconnectDelay = 2000;
    };

    this.textEventSource.onmessage = (event): void => {
      if (!event.data || this.feedMode() !== 'text' || this.isPaused()) return;
      try {
        const data: FeedTextEvent = JSON.parse(event.data);
        this.textFeedItems.update((list) => [data, ...list.slice(0, 99)]);
      } catch {
        // eslint-disable-next-line no-console
        console.warn('Non-JSON text feed event:', event.data);
      }
      const timer = window.setInterval(() => this.now.set(Date.now()), CLOCK_UPDATE_INTERVAL_MS);
      onCleanup(() => window.clearInterval(timer));
    });

    effect(() => {
      const status = this.activeStatus();
      const error = this.activeError();
      if (status === 'error' && error) {
        this.toast.show(error);
      } else if (status === 'offline') {
        this.toast.show('Connection interrupted. Waiting to reconnect...');
      }
    });

    effect(() => {
      const diagnostics = this.activeDiagnostics();
      const stalled = diagnostics.stalled;
      const previouslyStalled = this.wasStalled();
      if (stalled && !previouslyStalled) {
        this.toast.show('No realtime events detected. Monitoring for recovery...');
      } else if (!stalled && previouslyStalled) {
        this.toast.show('Realtime feed throughput restored.');
      }
      this.wasStalled.set(stalled);
    });

    effect(() => {
      const currentHealth = this.connectionHealth();
      const previous = this.previousHealth();
      if (currentHealth === previous) {
        return;
      }
      const diagnostics = this.activeDiagnostics();
      if (currentHealth === 'critical' && diagnostics.lastFailureReason === 'error') {
        this.toast.show('Feed is unstable. Automatic recovery attempts underway.');
      } else if (currentHealth === 'excellent' && previous !== 'excellent') {
        this.toast.show('Realtime feed stabilised with sustained uptime.');
      }
      this.previousHealth.set(currentHealth);
    });
  }

  ngOnInit(): void {
    this.feed.start(this.feedMode(), { reset: true });
  }

  ngOnDestroy(): void {
    this.feed.shutdown();
  }

  toggleFeedMode(mode: FeedType): void {
    const current = this.feedMode();
    if (current === mode) {
      return;
    }
    this.feed.stop(current, { keepItems: false });
    this.feed.reset(current, { clearItems: true, resetMetrics: false });
    this.feedMode.set(mode);
    this.feed.reset(mode, { clearItems: true });
    this.feed.start(mode);
    this.toast.show(`${mode === 'image' ? 'Image' : 'Text'} feed engaged.`);
  }

  togglePause(): void {
    const mode = this.feedMode();
    const { paused, flushed } = this.feed.togglePause(mode);
    if (paused) {
      this.toast.show('Feed paused. Incoming events will be buffered.');
    } else if (flushed > 0) {
      this.toast.show(`Feed resumed. Processed ${flushed} buffered events.`);
    } else {
      this.toast.show('Feed resumed.');
    }
  }

  retryActive(): void {
    const mode = this.feedMode();
    this.feed.restart(mode, { resetBackoff: true });
    this.toast.show('Attempting to reconnect the feed...');
  }

  private formatRelative(diff: number): string {
    if (diff < 0) {
      return '—';
    }
    if (diff < JUST_NOW_THRESHOLD_MS) {
      return 'Just now';
    }
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      const remSeconds = seconds % 60;
      return remSeconds > 0 ? `${minutes}m ${remSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      const remMinutes = minutes % 60;
      return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }

  private formatDuration(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '—';
    }
    if (value < 1000) {
      return '<1s';
    }
    return this.formatRelative(value).replace('Just now', '<1s');
  }
}
