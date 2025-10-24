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
        // Set log level based on environment
        const logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
        this.logger.setLogLevel(logLevel);
        this.logger.info(
          'Application initializing...',
          { environment: environment.production ? 'production' : 'development' },
          'AppInitializer'
        );

        // Start cache cleanup
        this.requestCache.startPeriodicCleanup(60000); // Every minute

        // Initialize Gemini client if API key is available
        const apiKey = this.config.getGeminiApiKey();
        if (apiKey) {
          initializeGeminiClient(apiKey);
          this.logger.info('Gemini API client initialized', undefined, 'AppInitializer');
        } else {
          this.logger.warn(
            'No Gemini API key found. AI features will be limited.',
            undefined,
            'AppInitializer'
          );
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
