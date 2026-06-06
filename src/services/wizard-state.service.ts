import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { PlatformService } from './platform.service';

export interface WizardSettingsSnapshot {
  selectedModel: string;
  enhancePrompt: boolean;
  seed?: number;
}

const DEFAULT_HISTORY_LIMIT = 10;

@Injectable({ providedIn: 'root' })
export class WizardStateService {
  private readonly logger = inject(LoggerService);
  private readonly platformService = inject(PlatformService);
  private readonly historyKey = 'polliwall.promptHistory';
  private readonly settingsKey = 'polliwall.wizardSettings';

  loadSettings(): Partial<WizardSettingsSnapshot> {
    const raw = this.read(this.settingsKey);
    if (!raw) {
      return {};
    }
    const parsed = this.parseJson(raw, 'wizard settings');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.remove(this.settingsKey);
      return {};
    }

    const candidate = parsed as Record<string, unknown>;
    const settings: Partial<WizardSettingsSnapshot> = {};
    if (typeof candidate['selectedModel'] === 'string' && candidate['selectedModel'].trim()) {
      settings.selectedModel = candidate['selectedModel'].trim();
    }
    if (typeof candidate['enhancePrompt'] === 'boolean') {
      settings.enhancePrompt = candidate['enhancePrompt'];
    }
    if (
      typeof candidate['seed'] === 'number' &&
      Number.isInteger(candidate['seed']) &&
      Number.isFinite(candidate['seed'])
    ) {
      settings.seed = candidate['seed'];
    } else if (candidate['seed'] !== undefined && candidate['seed'] !== null) {
      this.logger.warn('Ignoring invalid wizard seed from storage', candidate['seed'], 'WizardState');
    }
    return settings;
  }

  saveSettings(settings: WizardSettingsSnapshot): void {
    this.write(
      this.settingsKey,
      JSON.stringify({
        selectedModel: settings.selectedModel,
        enhancePrompt: settings.enhancePrompt,
        seed: settings.seed ?? null,
      })
    );
  }

  loadHistory(limit = DEFAULT_HISTORY_LIMIT): string[] {
    const raw = this.read(this.historyKey);
    if (!raw) {
      return [];
    }
    const parsed = this.parseJson(raw, 'prompt history');
    if (!Array.isArray(parsed)) {
      this.remove(this.historyKey);
      return [];
    }
    return this.normalizeHistory(parsed, limit);
  }

  saveHistory(history: readonly string[], limit = DEFAULT_HISTORY_LIMIT): void {
    this.write(this.historyKey, JSON.stringify(this.normalizeHistory([...history], limit)));
  }

  clearHistory(): void {
    this.remove(this.historyKey);
  }

  private normalizeHistory(history: unknown[], limit: number): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];
    for (const entry of history) {
      if (typeof entry !== 'string') {
        continue;
      }
      const prompt = entry.trim();
      if (!prompt || seen.has(prompt)) {
        continue;
      }
      seen.add(prompt);
      normalized.push(prompt);
      if (normalized.length >= limit) {
        break;
      }
    }
    return normalized;
  }

  private parseJson(value: string, label: string): unknown | null {
    try {
      return JSON.parse(value) as unknown;
    } catch (error) {
      this.logger.error(`Failed to parse ${label} from storage`, error, 'WizardState');
      return null;
    }
  }

  private read(key: string): string | null {
    try {
      return this.platformService.getLocalStorage()?.getItem(key) ?? null;
    } catch (error) {
      this.logger.error(`Failed to read ${key}`, error, 'WizardState');
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.platformService.getLocalStorage()?.setItem(key, value);
    } catch (error) {
      this.logger.error(`Failed to write ${key}`, error, 'WizardState');
    }
  }

  private remove(key: string): void {
    try {
      this.platformService.getLocalStorage()?.removeItem(key);
    } catch (error) {
      this.logger.error(`Failed to remove ${key}`, error, 'WizardState');
    }
  }
}
