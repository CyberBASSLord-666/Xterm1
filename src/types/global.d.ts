/**
 * Global type definitions for the application.
 */

/**
 * Runtime configuration interface for dynamic configuration injection.
 */
export interface RuntimeConfig {
  geminiApiKey?: string;
  analyticsMeasurementId?: string;
}

/**
 * Bootstrap configuration interface for environment configuration.
 */
export interface BootstrapConfig {
  meta?: {
    geminiApiKey?: string;
    analyticsMeasurementId?: string;
  };
  failOnMissingGeminiKey?: boolean;
}

/**
 * Environment interface with type-safe properties.
 */
export interface Environment {
  production: boolean;
  defaults?: {
    geminiApiKey?: string;
    analyticsMeasurementId?: string;
  };
  bootstrapConfig?: BootstrapConfig;
}

/**
 * Extend Window interface to include runtime configuration.
 */
declare global {
  interface Window {
    __POLLIWALL_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}
