


import { Component, ChangeDetectionStrategy, inject, effect, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { SettingsService } from './services/settings.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
})
export class AppComponent {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);

  isDarkTheme = this.settingsService.themeDark.asReadonly();
  isMobileMenuOpen = signal(false);

  constructor() {
    effect(() => {
      // This effect reacts to theme changes and applies the CSS class to the root <html> element.
      const isDark = this.settingsService.themeDark();
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }
  
  toggleTheme() {
    this.settingsService.themeDark.update(current => !current);
    const mode = this.settingsService.themeDark() ? 'Dark' : 'Light';
    this.toastService.show(`${mode} theme enabled`);
  }
  
  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }
}