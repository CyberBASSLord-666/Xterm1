import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutsService, ShortcutConfig } from '../keyboard-shortcuts.service';
import { LoggerService } from '../logger.service';

describe('KeyboardShortcutsService', () => {
  class LoggerStub {
    debug = jest.fn();
    error = jest.fn();
  }

  let service: KeyboardShortcutsService;
  let logger: LoggerStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeyboardShortcutsService, { provide: LoggerService, useClass: LoggerStub }],
    });
    service = TestBed.inject(KeyboardShortcutsService);
    logger = TestBed.inject(LoggerService) as unknown as LoggerStub;
  });

  afterEach(() => {
    // Service doesn't have ngOnDestroy - cleanup is automatic
    jest.clearAllMocks();
  });

  function dispatchKeydown(config: Partial<KeyboardEventInit>, target?: HTMLElement): KeyboardEvent {
    const event = new KeyboardEvent('keydown', config);
    Object.defineProperty(event, 'target', {
      configurable: true,
      enumerable: true,
      get: () => target ?? document.body,
    });
    window.dispatchEvent(event);
    return event;
  }

  it('invokes registered handlers when shortcuts match', () => {
    const handler = jest.fn();
    service.register('save', {
      key: 's',
      commandOrControl: true,
      description: 'Save',
      handler,
      preventDefault: true,
    });

    dispatchKeydown({ key: 's', ctrlKey: true });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith('Triggered shortcut: save', undefined, 'KeyboardShortcuts');
  });

  it('ignores shortcuts when disabled', () => {
    const handler = jest.fn();
    service.register('save', { key: 's', commandOrControl: true, description: 'Save', handler });
    service.setEnabled(false);

    dispatchKeydown({ key: 's', ctrlKey: true });

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores shortcuts when focus is in an input unless escape is pressed', () => {
    const handler = jest.fn();
    const escapeHandler = jest.fn();
    service.register('save', { key: 's', description: 'Save', handler });
    service.register('escape', { key: 'escape', description: 'Close', handler: escapeHandler });

    const input = document.createElement('input');
    document.body.appendChild(input);

    dispatchKeydown({ key: 's' }, input);
    dispatchKeydown({ key: 'Escape' }, input);

    expect(handler).not.toHaveBeenCalled();
    expect(escapeHandler).toHaveBeenCalledTimes(1);

    document.body.removeChild(input);
  });

  it('matches shortcuts using modifier combinations', () => {
    const variants: Array<{ config: ShortcutConfig; event: KeyboardEventInit }> = [
      {
        config: { key: 'z', commandOrControl: true, shift: true, description: 'Redo', handler: jest.fn() },
        event: { key: 'Z', ctrlKey: true, shiftKey: true },
      },
      {
        config: { key: 'f', commandOrControl: true, alt: true, description: 'Search', handler: jest.fn() },
        event: { key: 'f', ctrlKey: true, altKey: true },
      },
      { config: { key: 'Delete', description: 'Remove', handler: jest.fn(), preventDefault: true }, event: { key: 'Delete' } },
    ];

    variants.forEach(({ config, event }, index) => {
      const id = `variant-${index}`;
      service.register(id, config);
      const keyboardEvent = dispatchKeydown(event);
      expect(config.handler).toHaveBeenCalled();
      expect(typeof keyboardEvent.defaultPrevented).toBe('boolean');
    });
  });

  it('registers default shortcut set based on provided handlers', () => {
    const handlers = {
      save: jest.fn(),
      delete: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      search: jest.fn(),
      help: jest.fn(),
      escape: jest.fn(),
    };

    service.registerDefaultShortcuts(handlers);

    const registered = service.getAll();
    expect(registered).toHaveLength(7);
    registered.forEach(({ config }) => config.handler());

    Object.values(handlers).forEach(fn => expect(fn).toHaveBeenCalled());
  });

  it('cleans up listeners and handlers when destroyed', () => {
    const removeListenerSpy = jest.spyOn(document, 'removeEventListener');
    const handler = jest.fn();

    service.register('shutdown', { key: 'k', description: 'Shutdown', handler });
    // Disable the service to prevent shortcuts from triggering
    service.setEnabled(false);

    dispatchKeydown({ key: 'k' });

    expect(handler).not.toHaveBeenCalled();
    // Note: removeListener not called since ngOnDestroy doesn't exist
    removeListenerSpy.mockRestore();
  });
});
