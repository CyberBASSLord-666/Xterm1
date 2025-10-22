import { inject, Injectable } from '@angular/core';
import { LoggerService, LogLevel } from './logger.service';
import { ConfigService } from './config.service';
import { RequestCacheService } from './request-cache.service';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { initializeGeminiClient } from './pollinations.client';
import { environment } from '../environments/environment';
import { AnalyticsService } from './analytics.service';

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
  private readonly secretSources: Record<string, string | undefined> = {};

  /**
   * Initialize the application.
   * This is called during app bootstrap.
   */
  initialize(): Promise<void> {
    return this.perfMonitor.measureAsync('AppInitialization', async () => {
      try {
        // Validate environment configuration
        this.validateEnvironment();

        // Hydrate runtime configuration from secure bootstrap sources
        this.bootstrapSecrets();

        // Set log level based on environment
        const logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
        this.logger.setLogLevel(logLevel);
        this.logger.info(
          'Application initializing...',
          { environment: environment.production ? 'production' : 'development' },
          'AppInitializer'
        );

        // Security check: ensure HTTPS in production
        if (environment.production && typeof window !== 'undefined') {
          this.enforceSecureConnection();
        }

        // Start cache cleanup
        this.requestCache.startPeriodicCleanup(60000); // Every minute

        // Initialise analytics before bootstrapping the AI client
        this.initialiseAnalytics();

        // Initialize Gemini client if API key is available
        const apiKey = this.config.getGeminiApiKey();
        if (apiKey) {
          await initializeGeminiClient(apiKey);
          this.logger.info(
            'Gemini API client initialized',
            { source: this.secretSources.geminiApiKey ?? 'unspecified' },
            'AppInitializer'
          );
        } else {
          this.logger.error(
            'Gemini API key is not configured; aborting Gemini client bootstrap.',
            undefined,
            'AppInitializer'
          );
          const shouldFail = (environment as any).bootstrapConfig?.failOnMissingGeminiKey === true;
          if (environment.production && shouldFail) {
            throw new Error('Missing Gemini API key in production environment.');
          }
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
   * Validate environment configuration.
   * Ensures all required configuration is present and valid.
   */
  private validateEnvironment(): void {
    if (typeof environment === 'undefined') {
      throw new Error('Environment configuration is missing');
    }

    if (typeof environment.production !== 'boolean') {
      throw new Error('Environment production flag must be a boolean');
    }

    this.logger.debug('Environment validation passed', { production: environment.production }, 'AppInitializer');
  }

  /**
   * Enforce secure connection in production.
   * Redirects to HTTPS if accessed via HTTP.
   */
  private enforceSecureConnection(): void {
    const isSecure = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isSecure && !isLocalhost) {
      this.logger.warn('Insecure connection detected in production. Redirecting to HTTPS...', undefined, 'AppInitializer');
      // Redirect to HTTPS
      window.location.protocol = 'https:';
      window.location.reload();
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

  private bootstrapSecrets(): void {
    const bootstrapConfig = (environment as any).bootstrapConfig ?? {};
    const metaConfig = bootstrapConfig.meta ?? {};
    const runtimeConfig = this.getRuntimeConfiguration();

    const geminiFromRuntime = this.selectFirstTruthy('geminiApiKey', [
      [runtimeConfig.geminiApiKey, 'runtime-config'],
      [this.readMetaTag(metaConfig.geminiApiKey), metaConfig.geminiApiKey ? `meta:${metaConfig.geminiApiKey}` : 'meta'],
      [(environment as any).defaults?.geminiApiKey, 'environment.defaults'],
      [(environment as any).geminiApiKey, 'environment.legacy'],
    ]);

    if (geminiFromRuntime) {
      this.config.setGeminiApiKey(geminiFromRuntime);
      this.logger.debug(
        'Gemini API key resolved from secure bootstrap channel',
        { source: this.secretSources.geminiApiKey },
        'AppInitializer'
      );
    }

    const analyticsFromRuntime = this.selectFirstTruthy('analyticsMeasurementId', [
      [runtimeConfig.analyticsMeasurementId, 'runtime-config'],
      [
        this.readMetaTag(metaConfig.analyticsMeasurementId),
        metaConfig.analyticsMeasurementId ? `meta:${metaConfig.analyticsMeasurementId}` : 'meta',
      ],
      [(environment as any).defaults?.analyticsMeasurementId, 'environment.defaults'],
      [(environment as any).analyticsMeasurementId, 'environment.legacy'],
    ]);

    if (analyticsFromRuntime) {
      this.config.setAnalyticsMeasurementId(analyticsFromRuntime);
      this.logger.debug(
        'Analytics measurement identifier resolved',
        { source: this.secretSources.analyticsMeasurementId },
        'AppInitializer'
      );
    }
  }

  private initialiseAnalytics(): void {
    const measurementId = this.config.getAnalyticsMeasurementId();
    this.analytics.setEnabled(environment.production);

    if (!measurementId) {
      this.logger.warn('Analytics measurement ID not configured; analytics will remain disabled.', undefined, 'AppInitializer');
      return;
    }

    this.analytics.initialize(measurementId);
    this.logger.info(
      'Analytics initialised',
      { measurementId, source: this.secretSources.analyticsMeasurementId ?? 'unspecified' },
      'AppInitializer'
    );
  }

  private getRuntimeConfiguration(): { geminiApiKey?: string; analyticsMeasurementId?: string } {
    if (typeof window === 'undefined') {
      return {};
    }

    const globalConfig =
      (window as any).__POLLIWALL_RUNTIME_CONFIG__ ||
      (window as any).__POLLINATIONS_RUNTIME_CONFIG__ ||
      (window as any).__ENV__;

    if (!globalConfig || typeof globalConfig !== 'object') {
      return {};
    }

    return {
      geminiApiKey: this.normalizeRuntimeValue((globalConfig as any).geminiApiKey),
      analyticsMeasurementId: this.normalizeRuntimeValue(
        (globalConfig as any).analyticsMeasurementId ?? (globalConfig as any).analyticsMeasurementID
      ),
    };
  }

  private normalizeRuntimeValue(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private readMetaTag(name: unknown): string | undefined {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return undefined;
    }

    if (typeof document === 'undefined') {
      return undefined;
    }

    const meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      return undefined;
    }

    const content = meta.getAttribute('content');
    if (!content) {
      return undefined;
    }

    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private selectFirstTruthy(
    key: 'geminiApiKey' | 'analyticsMeasurementId',
    candidates: Array<[unknown, string | undefined]>
  ): string | undefined {
    for (const [candidate, source] of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          this.secretSources[key] = source ?? 'unspecified';
          return trimmed;
        }
      }
    }
    return undefined;
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
