import { Injectable, OnDestroy, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { PlatformService } from './platform.service';
import type { Metadata, PerformanceEntryWithProcessing } from '../types/utility.types';
import { CACHE_CONFIG, FEATURE_FLAGS } from '../constants';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Metadata;
}

export interface WebVitals {
  fcp?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  ttfb?: number;
  tti?: number;
}

interface PerformanceNavigationTimingExtended extends PerformanceEntry {
  responseStart?: number;
  requestStart?: number;
  domInteractive?: number;
  fetchStart?: number;
}

@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly platformService = inject(PlatformService);
  private readonly activeMetrics = new Map<string, PerformanceMetric>();
  private completedMetrics: PerformanceMetric[] = [];
  private readonly maxHistorySize = CACHE_CONFIG.MAX_CACHE_SIZE;
  private readonly enabled = FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING;
  private readonly webVitalsState: WebVitals = {};
  private readonly observers: PerformanceObserver[] = [];
  private webVitalsInitialized = false;
  private clsValue = 0;
  private clsSessionValue = 0;
  private clsSessionEntries: PerformanceEntryWithProcessing[] = [];

  public startMeasure(name: string, metadata?: Metadata): string {
    if (!this.enabled) {
      return `${name}-disabled-${Date.now()}`;
    }
    const id = `${name}-${Date.now()}-${Math.random()}`;
    const performance = this.platformService.getPerformance();
    const startTime = performance ? performance.now() : Date.now();
    this.activeMetrics.set(id, { name, startTime, metadata });
    return id;
  }

  endMeasure(id: string): void {
    if (!this.enabled) {
      return;
    }
    const metric = this.activeMetrics.get(id);
    if (!metric) {
      this.logger.warn(`Performance metric not found: ${id}`, undefined, 'PerformanceMonitor');
      return;
    }

    const performance = this.platformService.getPerformance();
    metric.endTime = performance ? performance.now() : Date.now();
    metric.duration = metric.endTime - metric.startTime;
    this.activeMetrics.delete(id);
    this.completedMetrics.push(metric);

    if (this.completedMetrics.length > this.maxHistorySize) {
      this.completedMetrics.shift();
    }

    if (metric.duration > 100) {
      this.logger.info(
        `Performance: ${metric.name} took ${metric.duration.toFixed(2)}ms`,
        metric,
        'PerformanceMonitor'
      );
    }
  }

  public async measureAsync<T>(name: string, operation: () => Promise<T>, metadata?: Metadata): Promise<T> {
    const id = this.startMeasure(name, metadata);
    try {
      return await operation();
    } finally {
      this.endMeasure(id);
    }
  }

  public measureSync<T>(name: string, operation: () => T, metadata?: Metadata): T {
    const id = this.startMeasure(name, metadata);
    try {
      return operation();
    } finally {
      this.endMeasure(id);
    }
  }

  getStats(name: string): { count: number; min: number; max: number; avg: number } | null {
    const metrics = this.completedMetrics.filter((m) => m.name === name);
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration ?? 0);
    return {
      count: metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    };
  }

  getHistory(): PerformanceMetric[] {
    return [...this.completedMetrics];
  }

  clearHistory(): void {
    this.completedMetrics = [];
  }

  initializeWebVitals(): void {
    if (this.webVitalsInitialized || !this.platformService.isBrowser) {
      return;
    }
    this.webVitalsInitialized = true;
    const win = this.platformService.getWindow();
    const performance = this.platformService.getPerformance();
    if (!win || !performance) {
      return;
    }

    this.captureNavigationVitals(performance);
    this.capturePaintVitals(performance);

    if (!('PerformanceObserver' in win)) {
      return;
    }

    this.observeLCP();
    this.observeFID();
    this.observeCLS();
  }

  public getWebVitals(): WebVitals {
    this.initializeWebVitals();
    return this.webVitalsState;
  }

  getWebVitalsRating(): Array<{ metric: string; value: number; rating: 'good' | 'needs-improvement' | 'poor' }> {
    const vitals = this.getWebVitals();
    const ratings: Array<{ metric: string; value: number; rating: 'good' | 'needs-improvement' | 'poor' }> = [];

    if (vitals.lcp !== undefined) {
      ratings.push({
        metric: 'LCP (Largest Contentful Paint)',
        value: vitals.lcp,
        rating: this.rate(vitals.lcp, 2500, 4000),
      });
    }
    if (vitals.fid !== undefined) {
      ratings.push({ metric: 'FID (First Input Delay)', value: vitals.fid, rating: this.rate(vitals.fid, 100, 300) });
    }
    if (vitals.cls !== undefined) {
      ratings.push({
        metric: 'CLS (Cumulative Layout Shift)',
        value: vitals.cls,
        rating: this.rate(vitals.cls, 0.1, 0.25),
      });
    }
    if (vitals.fcp !== undefined) {
      ratings.push({
        metric: 'FCP (First Contentful Paint)',
        value: vitals.fcp,
        rating: this.rate(vitals.fcp, 1800, 3000),
      });
    }
    if (vitals.ttfb !== undefined) {
      ratings.push({
        metric: 'TTFB (Time to First Byte)',
        value: vitals.ttfb,
        rating: this.rate(vitals.ttfb, 800, 1800),
      });
    }

    return ratings;
  }

  public logSummary(): void {
    const summary: Record<string, unknown> = {
      activeMetrics: this.activeMetrics.size,
      completedMetrics: this.completedMetrics.length,
      webVitals: this.getWebVitals(),
    };

    for (const op of ['ImageGeneration', 'ThumbnailCreation', 'DatabaseQuery']) {
      const stats = this.getStats(op);
      if (stats) {
        summary[op] = stats;
      }
    }

    this.logger.info('Performance Summary', summary, 'PerformanceMonitor');
  }

  ngOnDestroy(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers.length = 0;
    this.webVitalsInitialized = false;
  }

  private updateWebVitals(partial: WebVitals): void {
    Object.assign(this.webVitalsState, partial);
  }

  private captureNavigationVitals(performance: Performance): void {
    const navigation = performance.getEntriesByType('navigation')?.[0] as
      | PerformanceNavigationTimingExtended
      | undefined;
    if (!navigation) {
      return;
    }
    const next: WebVitals = {};
    if (navigation.responseStart !== undefined && navigation.requestStart !== undefined) {
      next.ttfb = navigation.responseStart - navigation.requestStart;
    }
    if (navigation.domInteractive !== undefined && navigation.fetchStart !== undefined) {
      next.tti = navigation.domInteractive - navigation.fetchStart;
    }
    this.updateWebVitals(next);
  }

  private capturePaintVitals(performance: Performance): void {
    const fcp = performance.getEntriesByType('paint')?.find((entry) => entry.name === 'first-contentful-paint');
    if (fcp) {
      this.updateWebVitals({ fcp: fcp.startTime });
    }
  }

  private observeLCP(): void {
    this.createObserver('largest-contentful-paint', (list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntryWithProcessing | undefined;
      if (lastEntry && (lastEntry.renderTime || lastEntry.loadTime)) {
        this.updateWebVitals({ lcp: lastEntry.renderTime ?? lastEntry.loadTime ?? 0 });
      }
    });
  }

  private observeFID(): void {
    this.createObserver('first-input', (list) => {
      for (const entry of list.getEntries()) {
        const typedEntry = entry as PerformanceEntryWithProcessing;
        if (typedEntry.processingStart) {
          this.updateWebVitals({ fid: typedEntry.processingStart - entry.startTime });
        }
      }
    });
  }

  private observeCLS(): void {
    this.createObserver('layout-shift', (list) => {
      for (const entry of list.getEntries()) {
        const typedEntry = entry as PerformanceEntryWithProcessing;
        if (typedEntry.hadRecentInput) {
          continue;
        }
        const firstSessionEntry = this.clsSessionEntries[0];
        const lastSessionEntry = this.clsSessionEntries[this.clsSessionEntries.length - 1];
        if (
          this.clsSessionValue &&
          lastSessionEntry &&
          firstSessionEntry &&
          entry.startTime - lastSessionEntry.startTime < 1000 &&
          entry.startTime - firstSessionEntry.startTime < 5000
        ) {
          this.clsSessionValue += typedEntry.value ?? 0;
          this.clsSessionEntries.push(typedEntry);
        } else {
          this.clsSessionValue = typedEntry.value ?? 0;
          this.clsSessionEntries = [typedEntry];
        }

        if (this.clsSessionValue > this.clsValue) {
          this.clsValue = this.clsSessionValue;
          this.updateWebVitals({ cls: this.clsValue });
        }
      }
    });
  }

  private createObserver(type: string, callback: PerformanceObserverCallback): void {
    try {
      const observer = new PerformanceObserver(callback);
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch {
      // The metric is not supported in this browser.
    }
  }

  private rate(value: number, goodThreshold: number, poorThreshold: number): 'good' | 'needs-improvement' | 'poor' {
    return value < goodThreshold ? 'good' : value < poorThreshold ? 'needs-improvement' : 'poor';
  }
}
