import { inject, Injectable } from '@angular/core';
import { LoggerService, LogLevel } from './logger.service';
import { ConfigService } from './config.service';
import { RequestCacheService } from './request-cache.service';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { AnalyticsService } from './analytics.service';
import { initializeGeminiClient } from './pollinations.client';
import { environment } from '../environments/environment';

/**
 * Runtime configuration interface for dynamic configuration injection.
 */
interface RuntimeConfig {
  geminiApiKey?: string;
  analyticsMeasurementId?: string;
}

/**
 * App initialization service.
 * Handles all app startup logic including service configuration and initialization.
 */
@Injectable({ providedIn: 'root' })
export class AppInitializerService {
  private logger = inject(LoggerService);
  private config = inject(ConfigService);
  private requestCache = inject(RequestCacheService);
  private keyboardShortcuts = inject(KeyboardShortcutsService);
  private perfMonitor = inject(PerformanceMonitorService);
  private analytics = inject(AnalyticsService);

  /**
   * Initialize the application.
   * This is called during app bootstrap.
   */
  initialize(): Promise<void> {
    return this.perfMonitor.measureAsync('AppInitialization', async () => {
      try {
        // Set log level based on environment
        const logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
        this.logger.setLogLevel(logLevel);
        this.logger.info(
          'Application initializing...',
          { environment: environment.production ? 'production' : 'development' },
          'AppInitializer'
        );

        // Hydrate configuration from various sources
        this.hydrateConfiguration();

        // Start cache cleanup
        this.requestCache.startPeriodicCleanup(60000); // Every minute

        // Initialize Gemini client if API key is available
        const apiKey = this.config.getGeminiApiKey();
        if (apiKey) {
          initializeGeminiClient(apiKey);
          this.logger.info('Gemini API client initialized', undefined, 'AppInitializer');
        } else {
          // Check if we should fail fast in production
          const bootstrapConfig = (environment as any).bootstrapConfig;
          if (environment.production && bootstrapConfig?.failOnMissingGeminiKey === true) {
            throw new Error('Missing Gemini API key in production environment.');
          }
          this.logger.warn(
            'No Gemini API key found. AI features will be limited.',
            undefined,
            'AppInitializer'
          );
        }

        // Initialize analytics if measurement ID is available
        const analyticsMeasurementId = this.config.getAnalyticsMeasurementId();
        if (analyticsMeasurementId) {
          this.analytics.setEnabled(true);
          this.analytics.initialize(analyticsMeasurementId);
          this.logger.info(
            'Analytics initialized',
            { measurementId: analyticsMeasurementId },
            'AppInitializer'
          );
        } else {
          this.logger.debug('Analytics not configured', undefined, 'AppInitializer');
        }

        // Setup default keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Log Web Vitals
        const vitals = this.perfMonitor.getWebVitals();
        this.logger.debug('Web Vitals', vitals, 'AppInitializer');

        this.logger.info('Application initialized successfully', undefined, 'AppInitializer');
      } catch (error) {
        this.logger.error('Failed to initialize application', error, 'AppInitializer');
        throw error;
      }
    });
  }

  /**
   * Hydrate configuration from multiple sources in priority order:
   * 1. Runtime config object (window.__POLLIWALL_RUNTIME_CONFIG__)
   * 2. Meta tags in document head
   * 3. Environment bootstrapConfig
   */
  private hydrateConfiguration(): void {
    // First, check for runtime config (highest priority)
    const runtimeConfig = (window as any).__POLLIWALL_RUNTIME_CONFIG__ as RuntimeConfig | undefined;
    if (runtimeConfig) {
      if (runtimeConfig.geminiApiKey) {
        this.config.setGeminiApiKey(runtimeConfig.geminiApiKey);
        this.logger.debug('Gemini API key loaded from runtime config', undefined, 'AppInitializer');
      }
      if (runtimeConfig.analyticsMeasurementId) {
        this.config.setAnalyticsMeasurementId(runtimeConfig.analyticsMeasurementId);
        this.logger.debug(
          'Analytics measurement ID loaded from runtime config',
          undefined,
          'AppInitializer'
        );
      }
      return; // Runtime config takes precedence, skip other sources
    }

    // Second, check for meta tags
    const bootstrapConfig = (environment as any).bootstrapConfig;
    if (bootstrapConfig?.meta) {
      const geminiKeyMeta = bootstrapConfig.meta.geminiApiKey;
      const analyticsIdMeta = bootstrapConfig.meta.analyticsMeasurementId;

      if (geminiKeyMeta) {
        const geminiMeta = document.querySelector(
          `meta[name="${geminiKeyMeta}"]`
        ) as HTMLMetaElement;
        if (geminiMeta) {
          const content = geminiMeta.getAttribute('content');
          if (content) {
            this.config.setGeminiApiKey(content);
            this.logger.debug('Gemini API key loaded from meta tag', undefined, 'AppInitializer');
          }
        }
      }

      if (analyticsIdMeta) {
        const analyticsMeta = document.querySelector(
          `meta[name="${analyticsIdMeta}"]`
        ) as HTMLMetaElement;
        if (analyticsMeta) {
          const content = analyticsMeta.getAttribute('content');
          if (content) {
            this.config.setAnalyticsMeasurementId(content);
            this.logger.debug(
              'Analytics measurement ID loaded from meta tag',
              undefined,
              'AppInitializer'
            );
          }
        }
      }
    }
  }

  /**
   * Setup default keyboard shortcuts.
   */
  private setupKeyboardShortcuts(): void {
    // Global keyboard shortcuts will be registered by individual components
    // This is just for setting up the service
    this.logger.debug('Keyboard shortcuts service ready', undefined, 'AppInitializer');
  }

  /**
   * Perform any cleanup needed when app is destroyed.
   */
  destroy(): void {
    this.logger.info('Application shutting down', undefined, 'AppInitializer');
    this.perfMonitor.logSummary();
  }
}

/**
 * Factory function for APP_INITIALIZER.
 */
export function initializeApp(appInitializer: AppInitializerService): () => Promise<void> {
  return () => appInitializer.initialize();
}
