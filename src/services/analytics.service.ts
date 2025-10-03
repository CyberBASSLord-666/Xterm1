import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { environment } from '../environments/environment';

export interface AnalyticsEvent {
  name: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
}

/**
 * Analytics service for tracking user interactions and application events.
 * Supports multiple analytics providers (Google Analytics, custom backend, etc.)
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private logger = inject(LoggerService);
  private enabled: boolean = environment.production;
  private eventQueue: AnalyticsEvent[] = [];
  private readonly maxQueueSize = 100;

  /**
   * Initialize analytics (call this in app initialization).
   * @param trackingId Google Analytics tracking ID or similar
   */
  initialize(trackingId?: string): void {
    if (!this.enabled) {
      this.logger.info('Analytics disabled in development mode', undefined, 'Analytics');
      return;
    }

    if (trackingId) {
      this.logger.info('Analytics initialized', { trackingId }, 'Analytics');
      
      // Initialize Google Analytics 4 (gtag.js)
      this.loadGoogleAnalytics(trackingId);
    }
  }

  /**
   * Load and initialize Google Analytics 4.
   * @param measurementId GA4 Measurement ID (e.g., 'G-XXXXXXXXXX')
   */
  private loadGoogleAnalytics(measurementId: string): void {
    // Check if gtag is already loaded
    if ((window as any).gtag) {
      (window as any).gtag('config', measurementId, {
        send_page_view: false, // We'll handle page views manually
      });
      return;
    }

    // Create and load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function() {
      (window as any).dataLayer.push(arguments);
    };
    (window as any).gtag('js', new Date());
    (window as any).gtag('config', measurementId, {
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
  trackPageView(path: string, title?: string): void {
    this.trackEvent({
      name: 'page_view',
      category: 'navigation',
      action: 'view',
      label: path,
    });

    if (this.enabled && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
        page_location: window.location.href,
      });
    }
  }

  /**
   * Track a custom event.
   * @param event The event to track
   */
  trackEvent(event: Omit<AnalyticsEvent, 'timestamp'>): void {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    // Add to queue
    this.eventQueue.push(fullEvent);
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }

    this.logger.debug('Analytics event tracked', fullEvent, 'Analytics');

    if (this.enabled && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        non_interaction: false,
      });
    }
  }

  /**
   * Track image generation.
   * @param model The AI model used
   * @param duration Generation duration in milliseconds
   */
  trackImageGeneration(model: string, duration: number): void {
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
  trackError(error: string, source: string): void {
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
  trackFeatureUsage(feature: string, action: string): void {
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
  trackInteraction(element: string, action: string): void {
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
  getEventQueue(): AnalyticsEvent[] {
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
    this.enabled = enabled;
    this.logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`, undefined, 'Analytics');
  }

  /**
   * Export analytics data (for privacy/GDPR compliance).
   */
  exportData(): string {
    return JSON.stringify(this.eventQueue, null, 2);
  }
}
