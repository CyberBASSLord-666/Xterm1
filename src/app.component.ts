import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { ShortcutsHelpComponent } from './components/shortcuts-help/shortcuts-help.component';
import { SettingsService } from './services/settings.service';
import { ToastService } from './services/toast.service';

interface AppNavigationItem {
  readonly label: string;
  readonly path: string;
  readonly exact?: boolean;
  readonly analyticsId?: string;
}

const EXACT_MATCH_OPTIONS = { exact: true } as const;
const DEFAULT_MATCH_OPTIONS = { exact: false } as const;

const APP_NAVIGATION_ITEMS: readonly AppNavigationItem[] = [
  { label: 'Create', path: '/', exact: true, analyticsId: 'nav-create' },
  { label: 'Gallery', path: '/gallery', analyticsId: 'nav-gallery' },
  { label: 'Collections', path: '/collections', analyticsId: 'nav-collections' },
  { label: 'Feed', path: '/feed', analyticsId: 'nav-feed' },
  { label: 'Settings', path: '/settings', analyticsId: 'nav-settings' },
] as const;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, ShortcutsHelpComponent],
})
export class AppComponent {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);
  private doc = inject(DOCUMENT, { optional: true });

  readonly navigationItems = APP_NAVIGATION_ITEMS;
  readonly exactMatchOptions = EXACT_MATCH_OPTIONS;
  readonly defaultMatchOptions = DEFAULT_MATCH_OPTIONS;

  isDarkTheme = this.settingsService.themeDark;
  isMobileMenuOpen = signal(false);
  private readonly isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

  readonly desktopNavLinkClass =
    'px-3 py-2 rounded-md text-sm font-medium text-secondary-text hover:text-accent transition-colors';
  readonly mobileNavLinkClass =
    'block px-3 py-2 rounded-md text-base font-medium text-secondary-text hover:text-accent hover:bg-secondary-bg transition-colors';

  constructor() {
    effect(() => {
      if (!this.isBrowser || !this.doc?.documentElement) {
        return;
      }
      const isDark = this.isDarkTheme();
      const root = this.doc.documentElement;
      root.classList.toggle('dark', isDark);
      root.dataset['theme'] = isDark ? 'dark' : 'light';
    });
  }

  toggleTheme(): void {
    const mode = this.settingsService.toggleTheme() ? 'Dark' : 'Light';
    this.toastService.show(`${mode} theme enabled`);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  handleMobileNavigation(): void {
    this.closeMobileMenu();
  }
}
