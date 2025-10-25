/**
 * Utility types for the application.
 * Provides comprehensive type safety across the codebase.
 */

/**
 * Generic metadata type for extensible objects.
 */
export type Metadata = Record<string, unknown>;

/**
 * Type-safe window extensions for global objects.
 */
export interface WindowWithAnalytics extends Window {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}

/**
 * Type-safe performance entry for Web Vitals.
 */
export interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart?: number;
  loadTime?: number;
  renderTime?: number;
  value?: number;
  hadRecentInput?: boolean;
}

/**
 * Type-safe configuration access.
 */
export interface EnvironmentConfig {
  geminiApiKey?: string;
  analyticsMeasurementId?: string;
  defaults?: {
    geminiApiKey?: string;
    analyticsMeasurementId?: string;
  };
  [key: string]: unknown;
}

/**
 * Generic error with optional cause.
 */
export interface ErrorWithCause extends Error {
  cause?: unknown;
  code?: string;
  status?: number;
}

/**
 * Type-safe JSON value.
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

/**
 * Utility type for making properties required.
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Utility type for making properties optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for creating immutable objects.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
