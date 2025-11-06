import { Injectable, OnDestroy, WritableSignal, EffectRef, computed, effect, signal } from '@angular/core';

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
  private readonly settingsKey = 'polliwall_settings';
  private readonly isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

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
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  ngOnDestroy(): void {
    this.persistEffect?.destroy();
    this.persistEffect = undefined;
    if (this.isBrowser) {
      window.removeEventListener('storage', this.handleStorageEvent);
    }
    this.systemThemeListenerCleanup?.();
    this.systemThemeListenerCleanup = null;
  }

  toggleTheme(): boolean {
    const next = !this.themeDarkState();
    this.setTheme(next);
    return next;
  }

  setTheme(dark: boolean): void {
    this.hasExplicitThemePreference = true;
    this.themeDarkState.set(dark);
  }

  resetThemeToSystemPreference(): void {
    this.hasExplicitThemePreference = false;
    this.themeDarkState.set(this.detectSystemDarkMode());
  }

  getGenerationOptions(): Omit<AppSettings, 'themeDark'> {
    return this.generationOptions();
  }

  private detectSystemDarkMode(): boolean {
    if (!this.isBrowser || typeof window.matchMedia !== 'function') {
      return this.defaultSettings.themeDark;
    }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return this.defaultSettings.themeDark;
    }
  }

  private detectDefaultReferrer(): string {
    if (!this.isBrowser) {
      return this.defaultSettings.referrer;
    }

    try {
      return window.location?.origin ?? this.defaultSettings.referrer;
    } catch {
      return this.defaultSettings.referrer;
    }
  }

  private readPersistedSettings(): StoredSettings {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const saved = window.localStorage.getItem(this.settingsKey);
      if (!saved) {
        return null;
      }
      const parsed = JSON.parse(saved) as StoredSettings;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return parsed;
    } catch (error) {
      console.error('Failed to read persisted settings', error);
      return null;
    }
  }

  private writePersistedSettings(settings: AppSettings): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to persist settings', error);
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
      const parsed = JSON.parse(event.newValue) as StoredSettings;
      if (!parsed) {
        return;
      }
      this.suppressPersistence = true;
      this.applySettings({ ...this.defaultSettings, referrer: this.detectDefaultReferrer(), ...parsed }, true);
    } catch (error) {
      console.error('Failed to synchronise settings from storage event', error);
    } finally {
      this.suppressPersistence = false;
    }
  };

  private observeSystemTheme(): void {
    if (!this.isBrowser || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateFromSystem = (matches: boolean) => {
      if (this.hasExplicitThemePreference) {
        return;
      }
      this.themeDarkState.set(matches);
    };

    updateFromSystem(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      updateFromSystem(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', listener);
      this.systemThemeListenerCleanup = () => mediaQuery.removeEventListener('change', listener);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(listener);
      this.systemThemeListenerCleanup = () => mediaQuery.removeListener(listener);
    } else {
      this.systemThemeListenerCleanup = null;
    }
  }
}
