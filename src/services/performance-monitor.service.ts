import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
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
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  tti?: number; // Time to Interactive
}

interface PerformanceNavigationTimingExtended extends PerformanceEntry {
  responseStart?: number;
  requestStart?: number;
  domInteractive?: number;
  fetchStart?: number;
}

/**
 * Service for monitoring and logging performance metrics.
 * Useful for identifying bottlenecks and optimizing the application.
 */
@Injectable({ providedIn: 'root' })
export class PerformanceMonitorService {
  private logger = inject(LoggerService);
  private activeMetrics = new Map<string, PerformanceMetric>();
  private completedMetrics: PerformanceMetric[] = [];
  private readonly maxHistorySize = CACHE_CONFIG.MAX_CACHE_SIZE;
  private readonly enabled = FEATURE_FLAGS.ENABLE_PERFORMANCE_MONITORING;

  /**
   * Start measuring a performance metric.
   * @param name The name of the metric
   * @param metadata Optional metadata to associate with the metric
   * @returns The metric ID
   */
  public startMeasure(name: string, metadata?: Metadata): string {
    const id = `${name}-${Date.now()}-${Math.random()}`;
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };
    this.activeMetrics.set(id, metric);
    return id;
  }

  /**
   * End measuring a performance metric.
   * @param id The metric ID returned from startMeasure
   */
  endMeasure(id: string): void {
    const metric = this.activeMetrics.get(id);
    if (!metric) {
      this.logger.warn(`Performance metric not found: ${id}`, undefined, 'PerformanceMonitor');
      return;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    this.activeMetrics.delete(id);
    this.completedMetrics.push(metric);

    // Keep history size manageable
    if (this.completedMetrics.length > this.maxHistorySize) {
      this.completedMetrics.shift();
    }

    // Log if duration is significant (> 100ms)
    if (metric.duration > 100) {
      this.logger.info(
        `Performance: ${metric.name} took ${metric.duration.toFixed(2)}ms`,
        metric,
        'PerformanceMonitor'
      );
    }
  }

  /**
   * Measure an async operation.
   * @param name The name of the operation
   * @param operation The async operation to measure
   * @param metadata Optional metadata
   * @returns The result of the operation
   */
  public async measureAsync<T>(name: string, operation: () => Promise<T>, metadata?: Metadata): Promise<T> {
    const id = this.startMeasure(name, metadata);
    try {
      return await operation();
    } finally {
      this.endMeasure(id);
    }
  }

  /**
   * Measure a synchronous operation.
   * @param name The name of the operation
   * @param operation The sync operation to measure
   * @param metadata Optional metadata
   * @returns The result of the operation
   */
  public measureSync<T>(name: string, operation: () => T, metadata?: Metadata): T {
    const id = this.startMeasure(name, metadata);
    try {
      return operation();
    } finally {
      this.endMeasure(id);
    }
  }

  /**
   * Get statistics for a specific metric name.
   */
  getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
  } | null {
    const metrics = this.completedMetrics.filter((m) => m.name === name);
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration || 0);
    return {
      count: metrics.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
    };
  }

  /**
   * Get all completed metrics.
   */
  getHistory(): PerformanceMetric[] {
    return [...this.completedMetrics];
  }

  /**
   * Clear metrics history.
   */
  clearHistory(): void {
    this.completedMetrics = [];
  }

  /**
   * Get Web Vitals metrics with full Core Web Vitals implementation.
   */
  /**
   * Get current Web Vitals metrics.
   * @returns Object containing available Web Vitals metrics
   */
  public getWebVitals(): WebVitals {
    const vitals: WebVitals = {};

    if ('PerformanceObserver' in window) {
      try {
        // Time to First Byte / Time to Interactive
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTimingExtended;

        let responseStart = navigation?.responseStart;
        let requestStart = navigation?.requestStart;
        let domInteractive = navigation?.domInteractive;
        let fetchStart = navigation?.fetchStart;

        const legacyTiming = (performance as Performance & { timing?: PerformanceTiming }).timing;
        if (legacyTiming) {
          responseStart = responseStart ?? legacyTiming.responseStart;
          requestStart = requestStart ?? legacyTiming.requestStart;
          domInteractive = domInteractive ?? legacyTiming.domInteractive;
          fetchStart = fetchStart ?? legacyTiming.fetchStart;
        }

        if (responseStart !== undefined && requestStart !== undefined) {
          vitals.ttfb = responseStart - requestStart;
        }
        if (domInteractive !== undefined && fetchStart !== undefined) {
          vitals.tti = domInteractive - fetchStart;
        }

        // First Contentful Paint
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');
        if (fcp) {
          vitals.fcp = fcp.startTime;
        }

        // Largest Contentful Paint
        this.observeLCP((value) => {
          vitals.lcp = value;
        });

        // First Input Delay
        this.observeFID((value) => {
          vitals.fid = value;
        });

        // Cumulative Layout Shift
        this.observeCLS((value) => {
          vitals.cls = value;
        });
      } catch (error) {
        this.logger.error('Failed to get Web Vitals', error, 'PerformanceMonitor');
      }
    }

    return vitals;
  }

  /**
   * Observe Largest Contentful Paint (LCP).
   */
  private observeLCP(callback: (value: number) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntryWithProcessing;
        if (lastEntry && (lastEntry.renderTime || lastEntry.loadTime)) {
          callback(lastEntry.renderTime ?? lastEntry.loadTime ?? 0);
        }
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // LCP not supported
    }
  }

  /**
   * Observe First Input Delay (FID).
   */
  private observeFID(callback: (value: number) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const typedEntry = entry as PerformanceEntryWithProcessing;
          if (typedEntry.processingStart) {
            callback(typedEntry.processingStart - entry.startTime);
          }
        });
      });
      observer.observe({ type: 'first-input', buffered: true });
    } catch {
      // FID not supported
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS).
   */
  private observeCLS(callback: (value: number) => void): void {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntryWithProcessing[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const typedEntry = entry as PerformanceEntryWithProcessing;
          if (!typedEntry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (
              sessionValue &&
              lastSessionEntry &&
              firstSessionEntry &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += typedEntry.value || 0;
              sessionEntries.push(typedEntry);
            } else {
              sessionValue = typedEntry.value || 0;
              sessionEntries = [typedEntry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              callback(clsValue);
            }
          }
        });
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // CLS not supported
    }
  }

  /**
   * Get Web Vitals rating based on WCAG thresholds.
   */
  getWebVitalsRating(): Array<{
    metric: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }> {
    const vitals = this.getWebVitals();
    const ratings: Array<{
      metric: string;
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    }> = [];

    // LCP thresholds
    if (vitals.lcp !== undefined) {
      const rating = vitals.lcp < 2500 ? 'good' : vitals.lcp < 4000 ? 'needs-improvement' : 'poor';
      ratings.push({ metric: 'LCP (Largest Contentful Paint)', value: vitals.lcp, rating });
    }

    // FID thresholds
    if (vitals.fid !== undefined) {
      const rating = vitals.fid < 100 ? 'good' : vitals.fid < 300 ? 'needs-improvement' : 'poor';
      ratings.push({ metric: 'FID (First Input Delay)', value: vitals.fid, rating });
    }

    // CLS thresholds
    if (vitals.cls !== undefined) {
      const rating = vitals.cls < 0.1 ? 'good' : vitals.cls < 0.25 ? 'needs-improvement' : 'poor';
      ratings.push({ metric: 'CLS (Cumulative Layout Shift)', value: vitals.cls, rating });
    }

    // FCP thresholds
    if (vitals.fcp !== undefined) {
      const rating = vitals.fcp < 1800 ? 'good' : vitals.fcp < 3000 ? 'needs-improvement' : 'poor';
      ratings.push({ metric: 'FCP (First Contentful Paint)', value: vitals.fcp, rating });
    }

    // TTFB thresholds
    if (vitals.ttfb !== undefined) {
      const rating = vitals.ttfb < 800 ? 'good' : vitals.ttfb < 1800 ? 'needs-improvement' : 'poor';
      ratings.push({ metric: 'TTFB (Time to First Byte)', value: vitals.ttfb, rating });
    }

    return ratings;
  }

  /**
   * Log current performance metrics summary.
   */
  public logSummary(): void {
    const summary: Record<string, unknown> = {
      activeMetrics: this.activeMetrics.size,
      completedMetrics: this.completedMetrics.length,
      webVitals: this.getWebVitals(),
    };

    // Get stats for common operations
    const commonOps = ['ImageGeneration', 'ThumbnailCreation', 'DatabaseQuery'];
    commonOps.forEach((op) => {
      const stats = this.getStats(op);
      if (stats) {
        summary[op] = stats;
      }
    });

    this.logger.info('Performance Summary', summary, 'PerformanceMonitor');
  }
}
