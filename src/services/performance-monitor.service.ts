import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
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
  private readonly maxHistorySize = 100;

  /**
   * Start measuring a performance metric.
   * @param name The name of the metric
   * @param metadata Optional metadata to associate with the metric
   * @returns The metric ID
   */
  startMeasure(name: string, metadata?: any): string {
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
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
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
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: any
  ): T {
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
    const metrics = this.completedMetrics.filter(m => m.name === name);
    if (metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration || 0);
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
   * Get Web Vitals metrics if available.
   */
  getWebVitals(): {
    fcp?: number; // First Contentful Paint
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
    ttfb?: number; // Time to First Byte
  } {
    const vitals: any = {};

    if ('PerformanceObserver' in window) {
      // Note: In a real implementation, you'd use the web-vitals library
      // This is a simplified version
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation) {
          vitals.ttfb = navigation.responseStart - navigation.requestStart;
        }

        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          vitals.fcp = fcp.startTime;
        }
      } catch (error) {
        this.logger.error('Failed to get Web Vitals', error, 'PerformanceMonitor');
      }
    }

    return vitals;
  }

  /**
   * Log current performance metrics summary.
   */
  logSummary(): void {
    const summary: any = {
      activeMetrics: this.activeMetrics.size,
      completedMetrics: this.completedMetrics.length,
      webVitals: this.getWebVitals(),
    };

    // Get stats for common operations
    const commonOps = ['ImageGeneration', 'ThumbnailCreation', 'DatabaseQuery'];
    commonOps.forEach(op => {
      const stats = this.getStats(op);
      if (stats) {
        summary[op] = stats;
      }
    });

    this.logger.info('Performance Summary', summary, 'PerformanceMonitor');
  }
}
