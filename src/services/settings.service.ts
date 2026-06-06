import { Injectable, OnDestroy, WritableSignal, EffectRef, computed, effect, signal, inject } from '@angular/core';
import { LoggerService } from './logger.service';
import { PlatformService } from './platform.service';

export interface AppSettings {
  referrer: string;
  nologo: boolean;
  private: boolean;
  safe: boolean;
  themeDark: boolean;
}

type StoredSettings = Partial<AppSettings> | null;

@Injectable({ providedIn: 'root' })
export class SettingsService implements OnDestroy {
  private readonly logger = inject(LoggerService);
  private readonly platformService = inject(PlatformService);
  private readonly settingsKey = 'polliwall_settings';
  private readonly isBrowser = this.platformService.isBrowser;

  private readonly defaultSettings: AppSettings = {
    referrer: 'https://pollinations.ai',
    nologo: true,
    private: true,
    safe: true,
    themeDark: false,
  };

  private readonly themeDarkState = signal<boolean>(this.defaultSettings.themeDark);

  readonly referrer: WritableSignal<string> = signal(this.defaultSettings.referrer);
  readonly nologo: WritableSignal<boolean> = signal(this.defaultSettings.nologo);
  readonly private: WritableSignal<boolean> = signal(this.defaultSettings.private);
  readonly safe: WritableSignal<boolean> = signal(this.defaultSettings.safe);
  readonly themeDark = this.themeDarkState.asReadonly();

  readonly settings = computed<AppSettings>(() => ({
    referrer: this.referrer(),
    nologo: this.nologo(),
    private: this.private(),
    safe: this.safe(),
    themeDark: this.themeDarkState(),
  }));

  readonly generationOptions = computed<Omit<AppSettings, 'themeDark'>>(() => ({
    referrer: this.referrer(),
    nologo: this.nologo(),
    private: this.private(),
    safe: this.safe(),
  }));

  private hasExplicitThemePreference = false;
  private persistEffect?: EffectRef;
  private suppressPersistence = false;
  private systemThemeListenerCleanup: (() => void) | null = null;

  constructor() {
    const stored = this.readPersistedSettings();
    if (stored) {
      this.applySettings({ ...this.defaultSettings, referrer: this.detectDefaultReferrer(), ...stored }, true);
    } else {
      this.applySettings(
        {
          ...this.defaultSettings,
          referrer: this.detectDefaultReferrer(),
          themeDark: this.detectSystemDarkMode(),
        },
        false
      );
    }

    if (this.isBrowser) {
      this.observeSystemTheme();
      this.persistEffect = effect(() => {
        if (this.suppressPersistence) {
          return;
        }
        const snapshot = this.settings();
        this.writePersistedSettings(snapshot);
      });
      this.platformService.getWindow()?.addEventListener('storage', this.handleStorageEvent);
    }
  }

  ngOnDestroy(): void {
    this.persistEffect?.destroy();
    this.persistEffect = undefined;
    if (this.isBrowser) {
      this.platformService.getWindow()?.removeEventListener('storage', this.handleStorageEvent);
    }
    this.systemThemeListenerCleanup?.();
    this.systemThemeListenerCleanup = null;
  }

  /**
   * Toggles the theme between dark and light mode.
   * Marks the theme as explicitly set by the user.
   * @returns The new theme state (true for dark, false for light)
   */
  toggleTheme(): boolean {
    const next = !this.themeDarkState();
    this.setTheme(next);
    return next;
  }

  /**
   * Sets the theme to the specified mode.
   * Marks the theme as explicitly set by the user.
   * @param dark - True for dark mode, false for light mode
   */
  setTheme(dark: boolean): void {
    this.hasExplicitThemePreference = true;
    this.themeDarkState.set(dark);
  }

  /**
   * Resets the theme preference to follow the system setting.
   * Clears any explicit user preference and re-applies system detection.
   */
  resetThemeToSystemPreference(): void {
    this.hasExplicitThemePreference = false;
    this.themeDarkState.set(this.detectSystemDarkMode());
  }

  getGenerationOptions(): Omit<AppSettings, 'themeDark'> {
    return this.generationOptions();
  }

  private detectSystemDarkMode(): boolean {
    if (!this.isBrowser || typeof this.platformService.getWindow()?.matchMedia !== 'function') {
      return this.defaultSettings.themeDark;
    }
    try {
      return (
        this.platformService.getWindow()?.matchMedia('(prefers-color-scheme: dark)').matches ??
        this.defaultSettings.themeDark
      );
    } catch {
      return this.defaultSettings.themeDark;
    }
  }

  private detectDefaultReferrer(): string {
    if (!this.isBrowser) {
      return this.defaultSettings.referrer;
    }

    try {
      return this.platformService.getWindow()?.location?.origin ?? this.defaultSettings.referrer;
    } catch {
      return this.defaultSettings.referrer;
    }
  }

  private readPersistedSettings(): StoredSettings {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const storage = this.platformService.getLocalStorage();
      const saved = storage?.getItem(this.settingsKey);
      if (!saved) {
        return null;
      }
      const parsed = this.parseStoredSettings(saved);
      if (!parsed) {
        storage?.removeItem(this.settingsKey);
      }
      return parsed;
    } catch (error) {
      this.logger.error('Failed to read persisted settings', error, 'Settings');
      return null;
    }
  }

  private writePersistedSettings(settings: AppSettings): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      this.platformService.getLocalStorage()?.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (error) {
      this.logger.error('Failed to persist settings', error, 'Settings');
    }
  }

  private parseStoredSettings(serialized: string): StoredSettings {
    let parsed: unknown;
    try {
      parsed = JSON.parse(serialized);
    } catch (error) {
      this.logger.error('Failed to parse persisted settings', error, 'Settings');
      return null;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.logger.warn('Ignoring persisted settings with an invalid shape', parsed, 'Settings');
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    const settings: Partial<AppSettings> = {};

    if ('referrer' in candidate) {
      const referrer = this.normalizeReferrer(candidate['referrer']);
      if (referrer) {
        settings.referrer = referrer;
      }
    }

    for (const key of ['nologo', 'private', 'safe', 'themeDark'] as const) {
      if (key in candidate && typeof candidate[key] === 'boolean') {
        settings[key] = candidate[key];
      }
    }

    return settings;
  }

  private normalizeReferrer(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    try {
      const url = new URL(trimmed, this.detectDefaultReferrer());
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return url.origin;
    } catch {
      return null;
    }
  }

  private applySettings(settings: AppSettings, markThemeExplicit: boolean): void {
    this.referrer.set(settings.referrer);
    this.nologo.set(settings.nologo);
    this.private.set(settings.private);
    this.safe.set(settings.safe);
    this.themeDarkState.set(settings.themeDark);
    this.hasExplicitThemePreference = markThemeExplicit;
  }

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== this.settingsKey || event.newValue === null) {
      return;
    }
    try {
      const parsed = this.parseStoredSettings(event.newValue);
      if (!parsed) {
        this.platformService.getLocalStorage()?.removeItem(this.settingsKey);
        return;
      }
      this.suppressPersistence = true;
      this.applySettings({ ...this.defaultSettings, referrer: this.detectDefaultReferrer(), ...parsed }, true);
    } catch (error) {
      this.logger.error('Failed to synchronise settings from storage event', error, 'Settings');
    } finally {
      this.suppressPersistence = false;
    }
  };

  private observeSystemTheme(): void {
    if (!this.isBrowser || typeof this.platformService.getWindow()?.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = this.platformService.getWindow()?.matchMedia('(prefers-color-scheme: dark)');
    if (!mediaQuery) {
      return;
    }
    const updateFromSystem = (matches: boolean): void => {
      if (this.hasExplicitThemePreference) {
        return;
      }
      this.themeDarkState.set(matches);
    };

    updateFromSystem(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent): void => {
      updateFromSystem(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      this.systemThemeListenerCleanup = (): void => mediaQuery.removeEventListener('change', listener);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener);
      this.systemThemeListenerCleanup = (): void => mediaQuery.removeListener(listener);
    } else {
      this.systemThemeListenerCleanup = null;
    }
  }
}
