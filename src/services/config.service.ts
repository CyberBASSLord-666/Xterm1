import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import type { EnvironmentConfig } from '../types/utility.types';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private geminiApiKey: string = this.normalizeString(
    (environment as EnvironmentConfig).geminiApiKey ??
      (environment as EnvironmentConfig).defaults?.geminiApiKey ??
      ''
  );
  private analyticsMeasurementId: string = this.normalizeString(
    (environment as EnvironmentConfig).analyticsMeasurementId ??
      (environment as EnvironmentConfig).defaults?.analyticsMeasurementId ??
      ''
  );

  /**
   * Set the Gemini API key. This should be called during app initialization
   * with a key from secure storage or user input.
   */
  public setGeminiApiKey(key: string): void {
    this.geminiApiKey = this.normalizeString(key);
  }

  /**
   * Get the Gemini API key. Returns empty string if not set.
   */
  public getGeminiApiKey(): string {
    return this.geminiApiKey;
  }

  /**
   * Check if the Gemini API key is configured.
   */
  public hasGeminiApiKey(): boolean {
    return this.geminiApiKey.length > 0;
  }

  /**
   * Set the analytics measurement identifier used for telemetry.
   */
  public setAnalyticsMeasurementId(measurementId: string): void {
    this.analyticsMeasurementId = this.normalizeString(measurementId);
  }

  /**
   * Retrieve the analytics measurement identifier, if any.
   */
  public getAnalyticsMeasurementId(): string {
    return this.analyticsMeasurementId;
  }

  /**
   * Determine whether analytics has a configured measurement identifier.
   */
  public hasAnalyticsMeasurementId(): boolean {
    return this.analyticsMeasurementId.length > 0;
  }

  private normalizeString(candidate: unknown): string {
    if (typeof candidate !== 'string') {
      return '';
    }
    return candidate.trim();
  }
}
