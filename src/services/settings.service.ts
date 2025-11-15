import { Injectable, signal, effect, inject } from '@angular/core';
import { PlatformService } from './platform.service';
import { LoggerService } from './logger.service';

export interface AppSettings {
  referrer: string;
  nologo: boolean;
  private: boolean;
  safe: boolean;
  themeDark: boolean;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private platformService = inject(PlatformService);
  private logger = inject(LoggerService);
  private readonly settingsKey = 'polliwall_settings';

  // Signals for all application settings
  referrer = signal<string>('');
  nologo = signal<boolean>(true);
  private = signal<boolean>(true);
  safe = signal<boolean>(true);
  themeDark = signal<boolean>(false);

  constructor() {
    this.load();

    // This effect will run whenever any setting signal changes, saving the entire state.
    effect(() => {
      this.save();
    });
  }

  private load(): void {
    const localStorage = this.platformService.getLocalStorage();
    if (!localStorage) {
      this.loadDefaults();
      return;
    }

    const saved = localStorage.getItem(this.settingsKey);
    if (saved) {
      try {
        const settings: AppSettings = JSON.parse(saved);
        const location = this.platformService.getLocation();
        this.referrer.set(settings.referrer ?? (location?.origin || ''));
        this.nologo.set(settings.nologo ?? true);
        this.private.set(settings.private ?? true);
        this.safe.set(settings.safe ?? true);
        this.themeDark.set(settings.themeDark ?? false);
      } catch (e) {
        this.logger.error('Failed to parse settings from localStorage', e as Error, 'Settings');
        this.loadDefaults();
      }
    } else {
      this.loadDefaults();
    }
  }

  private loadDefaults(): void {
    const location = this.platformService.getLocation();
    this.referrer.set(location?.origin || '');
    this.nologo.set(true);
    this.private.set(true);
    this.safe.set(true);

    // Detect dark mode preference in SSR-safe manner
    const prefersDark = this.platformService.runInBrowserOrFallback(
      () => this.platformService.matchMedia('(prefers-color-scheme: dark)')?.matches ?? false,
      false
    );
    this.themeDark.set(prefersDark);
  }

  private save(): void {
    const localStorage = this.platformService.getLocalStorage();
    if (!localStorage) {
      return; // Cannot save in non-browser context
    }

    const settings: AppSettings = {
      referrer: this.referrer(),
      nologo: this.nologo(),
      private: this.private(),
      safe: this.safe(),
      themeDark: this.themeDark(),
    };
    localStorage.setItem(this.settingsKey, JSON.stringify(settings));
  }

  // Kept for backward compatibility with wizard component's usage.
  getGenerationOptions(): Omit<AppSettings, 'themeDark'> {
    return {
      referrer: this.referrer(),
      nologo: this.nologo(),
      private: this.private(),
      safe: this.safe(),
    };
  }
}
