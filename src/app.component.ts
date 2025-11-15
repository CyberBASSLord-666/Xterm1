import { Component, ChangeDetectionStrategy, inject, effect, signal, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { ShortcutsHelpComponent } from './components/shortcuts-help/shortcuts-help.component';
import { SettingsService } from './services/settings.service';
import { ToastService } from './services/toast.service';
import { PlatformService } from './services/platform.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, ShortcutsHelpComponent],
})
export class AppComponent {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);
  private renderer = inject(Renderer2);
  private platformService = inject(PlatformService);
  private document = inject(DOCUMENT);

  isDarkTheme = this.settingsService.themeDark.asReadonly();
  isMobileMenuOpen = signal(false);

  constructor() {
    effect(() => {
      // This effect reacts to theme changes and applies the CSS class to the root <html> element.
      // Only manipulate DOM in browser context for SSR safety
      if (!this.platformService.isBrowser) {
        return;
      }

      const isDark = this.settingsService.themeDark();
      const documentElement = this.document.documentElement;

      if (isDark) {
        this.renderer.addClass(documentElement, 'dark');
      } else {
        this.renderer.removeClass(documentElement, 'dark');
      }
    });
  }

  toggleTheme(): void {
    this.settingsService.themeDark.update((current) => !current);
    const mode = this.settingsService.themeDark() ? 'Dark' : 'Light';
    this.toastService.show(`${mode} theme enabled`);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
