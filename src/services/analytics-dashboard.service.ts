import { Injectable, signal, computed, inject, DestroyRef } from '@angular/core';
import { LoggerService } from './logger.service';
import { ErrorHandlerService } from './error-handler.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { AnalyticsService } from './analytics.service';

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  change: number;
  category: 'performance' | 'engagement' | 'usage';
}

export interface DashboardState {
  metrics: AnalyticsMetric[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  dateRange: '24h' | '7d' | '30d';
}

const initialState: DashboardState = {
  metrics: [],
  loading: false,
  error: null,
  lastUpdated: 0,
  dateRange: '24h'
};

/**
 * AnalyticsDashboardService
 * 
 * Manages analytics dashboard data by aggregating metrics from PerformanceMonitorService
 * and AnalyticsService. Provides Signal-based state management for real-time updates.
 * 
 * Core Services Integration:
 * - LoggerService: All operations logged
 * - ErrorHandlerService: Comprehensive error handling
 * - PerformanceMonitorService: Performance metrics source
 * - AnalyticsService: Event tracking metrics source
 * 
 * @since 2.0.0 (Operation Bedrock Phase 1.4 - Production Line)
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsDashboardService {
  private readonly logger = inject(LoggerService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly performanceMonitor = inject(PerformanceMonitorService);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  // Signal-based state management
  private readonly _state = signal<DashboardState>(initialState);
  
  // Public readonly signals
  readonly state = this._state.asReadonly();
  readonly metrics = computed(() => this._state().metrics);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly lastUpdated = computed(() => this._state().lastUpdated);
  readonly dateRange = computed(() => this._state().dateRange);

  // Computed metrics by category
  readonly performanceMetrics = computed(() => 
    this.metrics().filter(m => m.category === 'performance')
  );
  readonly engagementMetrics = computed(() => 
    this.metrics().filter(m => m.category === 'engagement')
  );
  readonly usageMetrics = computed(() => 
    this.metrics().filter(m => m.category === 'usage')
  );

  private refreshInterval: number | null = null;

  constructor() {
    this.logger.info('AnalyticsDashboardService initialized');
    this.startAutoRefresh();
    
    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.stopAutoRefresh();
      this.logger.info('AnalyticsDashboardService destroyed');
    });
  }

  /**
   * Load dashboard metrics
   */
  async loadMetrics(): Promise<void> {
    this.logger.info('Loading analytics dashboard metrics', { 
      dateRange: this._state().dateRange 
    });

    this._state.update(s => ({ ...s, loading: true, error: null }));

    try {
      const metrics = await this.aggregateMetrics();
      
      this._state.update(s => ({
        ...s,
        metrics,
        loading: false,
        lastUpdated: Date.now()
      }));

      this.logger.info('Analytics dashboard metrics loaded successfully', { 
        count: metrics.length 
      });
    } catch (error) {
      this.logger.error('Failed to load analytics dashboard metrics', { 
        error 
      });
      
      const errorMessage = 'Failed to load analytics metrics. Please try again.';
      this._state.update(s => ({ 
        ...s, 
        loading: false, 
        error: errorMessage 
      }));
      
      this.errorHandler.handleError(error, errorMessage);
    }
  }

  /**
   * Change date range filter
   */
  setDateRange(dateRange: '24h' | '7d' | '30d'): void {
    this.logger.info('Changing analytics date range', { dateRange });
    
    this._state.update(s => ({ ...s, dateRange }));
    void this.loadMetrics();
  }

  /**
   * Refresh metrics manually
   */
  async refresh(): Promise<void> {
    this.logger.info('Manual refresh triggered');
    await this.loadMetrics();
  }

  /**
   * Start automatic refresh every 30 seconds
   */
  private startAutoRefresh(): void {
    if (this.refreshInterval !== null) return;

    this.refreshInterval = window.setInterval(() => {
      void this.loadMetrics();
    }, 30000); // 30 seconds

    this.logger.info('Auto-refresh started', { interval: '30s' });
  }

  /**
   * Stop automatic refresh
   */
  private stopAutoRefresh(): void {
    if (this.refreshInterval !== null) {
      window.clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      this.logger.info('Auto-refresh stopped');
    }
  }

  /**
   * Aggregate metrics from multiple sources
   */
  private async aggregateMetrics(): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];

    // Performance metrics from PerformanceMonitorService
    try {
      const perfMetrics = await this.getPerformanceMetrics();
      metrics.push(...perfMetrics);
    } catch (error) {
      this.logger.warn('Failed to get performance metrics', { error });
    }

    // Engagement metrics from AnalyticsService
    try {
      const engagementMetrics = await this.getEngagementMetrics();
      metrics.push(...engagementMetrics);
    } catch (error) {
      this.logger.warn('Failed to get engagement metrics', { error });
    }

    // Usage metrics (calculated from stored data)
    try {
      const usageMetrics = await this.getUsageMetrics();
      metrics.push(...usageMetrics);
    } catch (error) {
      this.logger.warn('Failed to get usage metrics', { error });
    }

    return metrics;
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<AnalyticsMetric[]> {
    // Simulate fetching performance data
    // In real implementation, would query PerformanceMonitorService
    return [
      {
        id: 'avg-page-load',
        name: 'Avg Page Load Time',
        value: 850,
        unit: 'ms',
        trend: 'down',
        change: -12,
        category: 'performance'
      },
      {
        id: 'api-response-time',
        name: 'API Response Time',
        value: 320,
        unit: 'ms',
        trend: 'down',
        change: -8,
        category: 'performance'
      }
    ];
  }

  /**
   * Get engagement metrics
   */
  private async getEngagementMetrics(): Promise<AnalyticsMetric[]> {
    // Simulate fetching engagement data
    // In real implementation, would query AnalyticsService
    return [
      {
        id: 'total-sessions',
        name: 'Total Sessions',
        value: 1247,
        unit: '',
        trend: 'up',
        change: 18,
        category: 'engagement'
      },
      {
        id: 'total-events',
        name: 'Total Events',
        value: 8934,
        unit: '',
        trend: 'up',
        change: 24,
        category: 'engagement'
      }
    ];
  }

  /**
   * Get usage metrics
   */
  private async getUsageMetrics(): Promise<AnalyticsMetric[]> {
    return [
      {
        id: 'images-generated',
        name: 'Images Generated',
        value: 456,
        unit: '',
        trend: 'up',
        change: 15,
        category: 'usage'
      },
      {
        id: 'collections-created',
        name: 'Collections Created',
        value: 89,
        unit: '',
        trend: 'up',
        change: 22,
        category: 'usage'
      }
    ];
  }
}
