import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private geminiApiKey: string = environment.geminiApiKey;

  /**
   * Set the Gemini API key. This should be called during app initialization
   * with a key from secure storage or user input.
   */
  setGeminiApiKey(key: string): void {
    this.geminiApiKey = key;
  }

  /**
   * Get the Gemini API key. Returns empty string if not set.
   */
  getGeminiApiKey(): string {
    return this.geminiApiKey;
  }

  /**
   * Check if the Gemini API key is configured.
   */
  hasGeminiApiKey(): boolean {
    return !!this.geminiApiKey && this.geminiApiKey.trim().length > 0;
  }
}
