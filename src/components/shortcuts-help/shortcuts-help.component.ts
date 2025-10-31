import { Component, ChangeDetectionStrategy, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { KeyboardShortcutsService, ShortcutConfig } from '../../services/keyboard-shortcuts.service';

@Component({
  selector: 'app-shortcuts-help',
  standalone: true,
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="close()">
        <div
          class="bg-secondary-bg rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          (click)="$event.stopPropagation()"
        >
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
              <button
                (click)="close()"
                class="text-secondary-text hover:text-primary-text transition-colors"
                aria-label="Close"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="space-y-3">
              @for (shortcut of shortcuts(); track shortcut.id) {
                <div class="flex justify-between items-center py-2 border-b border-primary-border last:border-0">
                  <span class="text-primary-text">{{ shortcut.config.description }}</span>
                  <kbd
                    class="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
                  >
                    @if (shortcut.config.ctrl || shortcut.config.meta) {
                      <span>Ctrl</span>
                      <span class="mx-1">+</span>
                    }
                    @if (shortcut.config.shift) {
                      <span>Shift</span>
                      <span class="mx-1">+</span>
                    }
                    @if (shortcut.config.alt) {
                      <span>Alt</span>
                      <span class="mx-1">+</span>
                    }
                    <span>{{ shortcut.config.key.toUpperCase() }}</span>
                  </kbd>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortcutsHelpComponent implements OnInit, OnDestroy {
  private keyboardShortcuts = inject(KeyboardShortcutsService);

  isOpen = signal(false);
  shortcuts = signal<Array<{ id: string; config: ShortcutConfig }>>([]);

  /**
   * Register keyboard shortcut for showing help overlay. Cleaned up in ngOnDestroy.
   */
  ngOnInit(): void {
    // Register the help overlay shortcut
    // Since this component is used once at app level, duplicate registration is not a concern
    // but we keep the check for defensive programming
    const alreadyRegistered = this.keyboardShortcuts.getAll().some((shortcut) => shortcut.id === 'help-overlay');

    if (!alreadyRegistered) {
      this.keyboardShortcuts.register('help-overlay', {
        key: '?',
        shift: true,
        description: 'Show this help',
        handler: (): void => this.toggle(),
        preventDefault: true,
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up registered shortcut to prevent memory leaks
    this.keyboardShortcuts.unregister('help-overlay');
  }

  toggle(): void {
    if (!this.isOpen()) {
      // Refresh shortcuts list when opening
      this.shortcuts.set(this.keyboardShortcuts.getAll());
    }
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
