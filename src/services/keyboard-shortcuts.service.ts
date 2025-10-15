import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

/**
 * Service for managing keyboard shortcuts across the application.
 * Provides a centralized way to register and handle keyboard events.
 */
@Injectable({ providedIn: 'root' })
export class KeyboardShortcutsService {
  private logger = inject(LoggerService);
  private shortcuts = new Map<string, ShortcutConfig>();
  private enabled = true;

  constructor() {
    this.setupGlobalListener();
  }

  /**
   * Register a keyboard shortcut.
   * @param id Unique identifier for the shortcut
   * @param config Shortcut configuration
   */
  register(id: string, config: ShortcutConfig): void {
    this.shortcuts.set(id, config);
    this.logger.debug(
      `Registered keyboard shortcut: ${id}`,
      { key: config.key, description: config.description },
      'KeyboardShortcuts'
    );
  }

  /**
   * Unregister a keyboard shortcut.
   * @param id The shortcut identifier
   */
  unregister(id: string): void {
    if (this.shortcuts.delete(id)) {
      this.logger.debug(`Unregistered keyboard shortcut: ${id}`, undefined, 'KeyboardShortcuts');
    }
  }

  /**
   * Enable or disable all keyboard shortcuts.
   * @param enabled Whether shortcuts should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.logger.debug(
      `Keyboard shortcuts ${enabled ? 'enabled' : 'disabled'}`,
      undefined,
      'KeyboardShortcuts'
    );
  }

  /**
   * Get all registered shortcuts (useful for displaying help).
   */
  getAll(): Array<{ id: string; config: ShortcutConfig }> {
    return Array.from(this.shortcuts.entries()).map(([id, config]) => ({ id, config }));
  }

  /**
   * Setup global keyboard event listener.
   */
  private setupGlobalListener(): void {
    document.addEventListener('keydown', (event) => {
      if (!this.enabled) {
        return;
      }

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Exception: Allow Escape key in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Find matching shortcut
      for (const [id, config] of this.shortcuts.entries()) {
        if (this.matchesShortcut(event, config)) {
          this.logger.debug(`Triggered shortcut: ${id}`, undefined, 'KeyboardShortcuts');

          if (config.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
          }

          try {
            config.handler();
          } catch (error) {
            this.logger.error(`Error executing shortcut ${id}`, error, 'KeyboardShortcuts');
          }

          break;
        }
      }
    });
  }

  /**
   * Check if a keyboard event matches a shortcut configuration.
   */
  private matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
    // Normalize key for comparison
    const eventKey = event.key.toLowerCase();
    const configKey = config.key.toLowerCase();

    // Check key
    if (eventKey !== configKey) {
      return false;
    }

    // Check modifiers
    if (config.ctrl !== undefined && event.ctrlKey !== config.ctrl) {
      return false;
    }
    if (config.shift !== undefined && event.shiftKey !== config.shift) {
      return false;
    }
    if (config.alt !== undefined && event.altKey !== config.alt) {
      return false;
    }
    if (config.meta !== undefined && event.metaKey !== config.meta) {
      return false;
    }

    return true;
  }

  /**
   * Register common application shortcuts.
   */
  registerDefaultShortcuts(handlers: {
    save?: () => void;
    delete?: () => void;
    undo?: () => void;
    redo?: () => void;
    search?: () => void;
    help?: () => void;
    escape?: () => void;
  }): void {
    if (handlers.save) {
      this.register('save', {
        key: 's',
        ctrl: true,
        description: 'Save current item',
        handler: handlers.save,
        preventDefault: true,
      });
    }

    if (handlers.delete) {
      this.register('delete', {
        key: 'delete',
        description: 'Delete selected item',
        handler: handlers.delete,
        preventDefault: true,
      });
    }

    if (handlers.undo) {
      this.register('undo', {
        key: 'z',
        ctrl: true,
        description: 'Undo last action',
        handler: handlers.undo,
        preventDefault: true,
      });
    }

    if (handlers.redo) {
      this.register('redo', {
        key: 'y',
        ctrl: true,
        description: 'Redo last undone action',
        handler: handlers.redo,
        preventDefault: true,
      });
    }

    if (handlers.search) {
      this.register('search', {
        key: 'f',
        ctrl: true,
        description: 'Search',
        handler: handlers.search,
        preventDefault: true,
      });
    }

    if (handlers.help) {
      this.register('help', {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts help',
        handler: handlers.help,
        preventDefault: true,
      });
    }

    if (handlers.escape) {
      this.register('escape', {
        key: 'escape',
        description: 'Close dialog or cancel action',
        handler: handlers.escape,
        preventDefault: false,
      });
    }
  }
}
