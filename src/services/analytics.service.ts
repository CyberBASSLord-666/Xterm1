import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LoggerService } from './logger.service';
import { PlatformService } from './platform.service';
import { environment } from '../environments/environment';
import type { WindowWithAnalytics } from '../types/utility.types';
import { PERFORMANCE_CONFIG, FEATURE_FLAGS } from '../constants';

export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  anonymizeIp?: boolean;
  cookieFlags?: string;
  debugMode?: boolean;
}

/**
 * Analytics service for tracking user interactions and application events.
 * Supports multiple analytics providers (Google Analytics, custom backend, etc.)
 * Implements batch event sending for improved performance.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private logger = inject(LoggerService);
  private platformService = inject(PlatformService);
  private document = inject(DOCUMENT);
  private enabled: boolean = environment.production && FEATURE_FLAGS.ENABLE_ANALYTICS;
  private eventQueue: AnalyticsEvent[] = [];
  private readonly maxQueueSize = PERFORMANCE_CONFIG.MAX_ANALYTICS_QUEUE;
  private batchTimer: number | null = null;
  private readonly batchInterval = 5000; // Send batch every 5 seconds
  private readonly batchSize = 10; // Maximum events per batch
  private isSendingBatch = false; // Prevents concurrent batch sends

  /**
   * Initialize analytics (call this in app initialization).
   * @param trackingId Google Analytics tracking ID or similar
   */
  public initialize(trackingId?: string): void {
    if (!this.platformService.isBrowser) {
      return; // Skip initialization in SSR
    }

    if (!this.enabled) {
      this.logger.info('Analytics disabled in development mode', undefined, 'Analytics');
      return;
    }

    if (trackingId) {
      this.logger.info('Analytics initialized', { trackingId }, 'Analytics');

      // Initialize Google Analytics 4 (gtag.js)
      this.loadGoogleAnalytics(trackingId);

      // Start batch event sending timer
      this.startBatchTimer();
    }
  }

  /**
   * Load and initialize Google Analytics 4.
   * @param measurementId GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
   */
  private loadGoogleAnalytics(measurementId: string): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    const win = this.platformService.getWindow() as WindowWithAnalytics | undefined;
    if (!win) {
      return;
    }

    // Check if gtag is already loaded
    if (win.gtag) {
      win.gtag('config', measurementId, {
        send_page_view: false, // We'll handle page views manually
      });
      return;
    }

    // Create and load gtag script
    const script = this.document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    this.document.head.appendChild(script);

    // Initialize gtag
    win.dataLayer = win.dataLayer || [];
    win.gtag = function (...args: unknown[]): void {
      win.dataLayer?.push(args);
    };
    win.gtag('js', new Date());
    win.gtag('config', measurementId, {
      send_page_view: false,
      anonymize_ip: true, // GDPR compliance
      cookie_flags: 'SameSite=None;Secure',
    });

    this.logger.info('Google Analytics loaded', { measurementId }, 'Analytics');
  }

  /**
   * Track a page view.
   * @param path The page path
   * @param title The page title
   */
  public trackPageView(path: string, title?: string): void {
    this.trackEvent({
      name: 'page_view',
      category: 'navigation',
      action: 'view',
      label: path,
    });

    if (!this.platformService.isBrowser) {
      return;
    }

    const win = this.platformService.getWindow() as WindowWithAnalytics | undefined;
    if (this.enabled && win?.gtag) {
      const location = this.platformService.getLocation();
      win.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || this.document.title,
        page_location: location?.href || '',
      });
    }
  }

  /**
   * Track a custom event with full type safety.
   * Events are queued and sent in batches for improved performance.
   * @param event The event to track
   */
  public trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    // Validate event structure
    if (!event.name || typeof event.name !== 'string') {
      this.logger.warn('Invalid event name', event, 'Analytics');
      return;
    }

    if (!event.category || typeof event.category !== 'string') {
      this.logger.warn('Invalid event category', event, 'Analytics');
      return;
    }

    if (!event.action || typeof event.action !== 'string') {
      this.logger.warn('Invalid event action', event, 'Analytics');
      return;
    }

    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Add to queue
    this.eventQueue.push(fullEvent);
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }

    this.logger.debug('Analytics event queued', fullEvent, 'Analytics');

    // Send batch immediately if queue size threshold reached
    if (this.eventQueue.length >= this.batchSize) {
      this.sendBatch();
    }
  }

  /**
   * Start the batch timer for periodic event sending.
   * @private
   */
  private startBatchTimer(): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    if (this.batchTimer !== null) {
      return; // Timer already running
    }

    // Use platform service for SSR-safe timer
    this.batchTimer =
      this.platformService.setInterval(() => {
        if (this.eventQueue.length > 0) {
          this.sendBatch();
        }
      }, this.batchInterval) ?? null;

    this.logger.debug('Batch timer started', { interval: this.batchInterval }, 'Analytics');
  }

  /**
   * Stop the batch timer and ensure cleanup.
   * @private
   */
  private stopBatchTimer(): void {
    if (this.batchTimer !== null) {
      this.platformService.clearInterval(this.batchTimer);
      this.batchTimer = null;
      this.logger.debug('Batch timer stopped', undefined, 'Analytics');
    }
  }

  /**
   * Send queued events in a batch to analytics provider.
   * Prevents concurrent batch sends using a flag and moves splice after flag is set
   * to eliminate race conditions between timer and threshold triggers.
   * @private
   */
  private sendBatch(): void {
    if (!this.platformService.isBrowser) {
      return;
    }

    // Prevent concurrent batch sends by setting flag immediately before any other operations
    if (this.isSendingBatch) {
      return;
    }
    this.isSendingBatch = true;

    // Early exit checks (after flag is set to prevent race conditions)
    if (this.eventQueue.length === 0) {
      this.isSendingBatch = false;
      return;
    }

    const win = this.platformService.getWindow() as WindowWithAnalytics | undefined;
    if (!this.enabled || !win?.gtag) {
      this.isSendingBatch = false;
      return;
    }

    // Take events to send (up to batchSize)
    const eventsToSend = this.eventQueue.splice(0, this.batchSize);

    try {
      // Send each event in the batch
      for (const event of eventsToSend) {
        const eventParams: Record<string, string | number | boolean> = {
          event_category: event.category,
          event_label: event.label || '',
          non_interaction: false,
        };

        if (typeof event.value === 'number') {
          eventParams.value = event.value;
        }

        if (event.metadata) {
          Object.assign(eventParams, event.metadata);
        }

        win.gtag('event', event.action, eventParams);
      }

      this.logger.debug('Batch sent', { count: eventsToSend.length }, 'Analytics');
    } catch (error) {
      this.logger.error('Failed to send batch to GA', error, 'Analytics');
    } finally {
      this.isSendingBatch = false;
    }
  }

  /**
   * Track image generation.
   * @param model The AI model used
   * @param duration Generation duration in milliseconds
   */
  public trackImageGeneration(model: string, duration: number): void {
    this.trackEvent({
      name: 'image_generation',
      category: 'generation',
      action: 'generate',
      label: model,
      value: duration,
    });
  }

  /**
   * Track error occurrence.
   * @param error The error message
   * @param source The source of the error
   */
  public trackError(error: string, source: string): void {
    this.trackEvent({
      name: 'error',
      category: 'error',
      action: 'occurred',
      label: `${source}: ${error}`,
    });
  }

  /**
   * Track feature usage.
   * @param feature The feature name
   * @param action The action performed
   */
  public trackFeatureUsage(feature: string, action: string): void {
    this.trackEvent({
      name: 'feature_usage',
      category: 'feature',
      action: action,
      label: feature,
    });
  }

  /**
   * Track user interaction.
   * @param element The element interacted with
   * @param action The interaction type
   */
  public trackInteraction(element: string, action: string): void {
    this.trackEvent({
      name: 'user_interaction',
      category: 'interaction',
      action: action,
      label: element,
    });
  }

  /**
   * Get tracked events (for debugging).
   */
  public getEventQueue(): AnalyticsEvent[] {
    return [...this.eventQueue];
  }

  /**
   * Clear event queue.
   */
  clearEventQueue(): void {
    this.eventQueue = [];
  }

  /**
   * Enable or disable analytics.
   */
  setEnabled(enabled: boolean): void {
    const wasEnabled = this.enabled;
    this.enabled = enabled;
    this.logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`, undefined, 'Analytics');

    // Manage batch timer based on enabled state
    if (enabled && !wasEnabled) {
      this.startBatchTimer();
    } else if (!enabled && wasEnabled) {
      this.stopBatchTimer();
      this.clearEventQueue();
    }
  }

  /**
   * Flush all queued events immediately.
   * Useful when the application is about to close or navigate away.
   */
  public flush(): void {
    if (this.eventQueue.length > 0) {
      this.logger.debug('Flushing analytics queue', { count: this.eventQueue.length }, 'Analytics');
      this.sendBatch();
    }
  }

  /**
   * Cleanup method to be called when the service is destroyed.
   * Stops the batch timer and flushes any remaining events.
   *
   * Note: Since this service is providedIn: 'root', it won't be automatically destroyed.
   * This method is primarily intended for:
   * - Unit testing scenarios where services need explicit cleanup
   * - Manual cleanup in specific use cases (e.g., before app shutdown)
   * - Integration testing environments
   *
   * For production apps, consider calling flush() on beforeunload event instead.
   */
  public destroy(): void {
    this.stopBatchTimer();
    this.flush();
  }

  /**
   * Export analytics data (for privacy/GDPR compliance).
   */
  exportData(): string {
    return JSON.stringify(this.eventQueue, null, 2);
  }
}
