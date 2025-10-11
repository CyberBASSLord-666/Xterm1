import { inject, Injectable } from '@angular/core';
import { LoggerService, LogLevel } from './logger.service';
import { ConfigService } from './config.service';
import { RequestCacheService } from './request-cache.service';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { PerformanceMonitorService } from './performance-monitor.service';
import { initializeGeminiClient } from './pollinations.client';
import { environment } from '../environments/environment';

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

  /**
   * Initialize the application.
   * This is called during app bootstrap.
   */
  initialize(): Promise<void> {
    return this.perfMonitor.measureAsync('AppInitialization', async () => {
      try {
        // Validate environment configuration
        this.validateEnvironment();

        // Set log level based on environment
        const logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
        this.logger.setLogLevel(logLevel);
        this.logger.info('Application initializing...', { environment: environment.production ? 'production' : 'development' }, 'AppInitializer');

        // Security check: ensure HTTPS in production
        if (environment.production && typeof window !== 'undefined') {
          this.enforceSecureConnection();
        }

        // Start cache cleanup
        this.requestCache.startPeriodicCleanup(60000); // Every minute

        // Initialize Gemini client if API key is available
        const apiKey = this.config.getGeminiApiKey() || environment.geminiApiKey;
        if (apiKey) {
          initializeGeminiClient(apiKey);
          this.logger.info('Gemini API client initialized', undefined, 'AppInitializer');
        } else {
          this.logger.warn('No Gemini API key found. AI features will be limited.', undefined, 'AppInitializer');
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

    // Validate that geminiApiKey is a string (can be empty)
    if (typeof environment.geminiApiKey !== 'string') {
      throw new Error('Environment geminiApiKey must be a string');
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
