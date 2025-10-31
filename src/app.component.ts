import { Component, ChangeDetectionStrategy, inject, effect, signal, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastComponent } from './components/toast/toast.component';
import { SettingsService } from './services/settings.service';
import { ToastService } from './services/toast.service';
import { KeyboardShortcutsService, type ShortcutConfig } from './services/keyboard-shortcuts.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
})
export class AppComponent implements OnDestroy {
  private settingsService = inject(SettingsService);
  private toastService = inject(ToastService);
  private keyboardShortcuts = inject(KeyboardShortcutsService);

  private disposeShortcuts: (() => void) | null = null;

  isDarkTheme = this.settingsService.themeDark.asReadonly();
  isMobileMenuOpen = signal(false);
  isShortcutHelpOpen = signal(false);
  shortcutEntries = signal<Array<{ id: string; description: string; shortcut: string }>>([]);

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

    this.disposeShortcuts = this.keyboardShortcuts.registerScope('app', [
      {
        key: '?',
        shift: true,
        description: 'Toggle keyboard shortcut help',
        handler: () => this.toggleShortcutHelp(),
        preventDefault: true,
      },
      {
        key: 'escape',
        description: 'Close keyboard shortcut help',
        handler: () => this.isShortcutHelpOpen.set(false),
        preventDefault: false,
        guard: () => this.isShortcutHelpOpen(),
      },
    ]);
  }

  public ngOnDestroy(): void {
    this.disposeShortcuts?.();
    this.disposeShortcuts = null;
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

  toggleShortcutHelp(): void {
    if (!this.isShortcutHelpOpen()) {
      const entries = this.keyboardShortcuts.getAll().map(({ id, config }) => ({
        id,
        description: config.description,
        shortcut: this.describeShortcut(config),
      }));
      this.shortcutEntries.set(entries);
    }
    this.isShortcutHelpOpen.update((open) => !open);
  }

  private describeShortcut(config: ShortcutConfig): string {
    const parts: string[] = [];
    if (config.commandOrControl) {
      parts.push('Ctrl/Cmd');
    } else {
      if (config.ctrl) parts.push('Ctrl');
      if (config.meta) parts.push('Cmd');
    }
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');

    const keyLabel = config.key.length === 1 ? config.key.toUpperCase() : config.key;
    parts.push(keyLabel);
    return parts.join(' + ');
  }
}
