/**
 * Shortcuts Help Component Test Suite
 * Tests for keyboard shortcuts help overlay component
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShortcutsHelpComponent } from '../shortcuts-help.component';
import { KeyboardShortcutsService, ShortcutConfig } from '../../../services/keyboard-shortcuts.service';

describe('ShortcutsHelpComponent', () => {
  let component: ShortcutsHelpComponent;
  let fixture: ComponentFixture<ShortcutsHelpComponent>;
  let keyboardShortcutsService: jest.Mocked<KeyboardShortcutsService>;

  const mockShortcuts: Array<{ id: string; config: ShortcutConfig }> = [
    {
      id: 'test-shortcut-1',
      config: {
        key: 'g',
        description: 'Go to gallery',
        handler: jest.fn(),
      },
    },
    {
      id: 'test-shortcut-2',
      config: {
        key: 's',
        ctrl: true,
        description: 'Save image',
        handler: jest.fn(),
      },
    },
    {
      id: 'test-shortcut-3',
      config: {
        key: 'z',
        ctrl: true,
        shift: true,
        description: 'Redo',
        handler: jest.fn(),
      },
    },
    {
      id: 'test-shortcut-4',
      config: {
        key: 'i',
        alt: true,
        description: 'Toggle info',
        handler: jest.fn(),
      },
    },
  ];

  beforeEach(async () => {
    const keyboardShortcutsSpy = {
      register: jest.fn(),
      unregister: jest.fn(),
      getAll: jest.fn().mockReturnValue(mockShortcuts),
    };

    await TestBed.configureTestingModule({
      imports: [ShortcutsHelpComponent],
      providers: [{ provide: KeyboardShortcutsService, useValue: keyboardShortcutsSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ShortcutsHelpComponent);
    component = fixture.componentInstance;
    keyboardShortcutsService = TestBed.inject(KeyboardShortcutsService) as jest.Mocked<KeyboardShortcutsService>;
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should be closed by default', () => {
      expect(component.isOpen()).toBe(false);
    });

    it('should have empty shortcuts by default', () => {
      expect(component.shortcuts()).toEqual([]);
    });

    it('should register help-overlay shortcut on init if not already registered', () => {
      keyboardShortcutsService.getAll.mockReturnValue([]);
      component.ngOnInit();

      expect(keyboardShortcutsService.register).toHaveBeenCalledWith(
        'help-overlay',
        expect.objectContaining({
          key: '?',
          shift: true,
          description: 'Show this help',
          preventDefault: true,
        })
      );
    });

    it('should not register help-overlay shortcut if already registered', () => {
      keyboardShortcutsService.getAll.mockReturnValue([
        { id: 'help-overlay', config: { key: '?', shift: true, description: 'Show this help', handler: jest.fn() } },
      ]);
      component.ngOnInit();

      expect(keyboardShortcutsService.register).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should unregister help-overlay shortcut on destroy', () => {
      component.ngOnDestroy();

      expect(keyboardShortcutsService.unregister).toHaveBeenCalledWith('help-overlay');
    });
  });

  describe('Toggle behavior', () => {
    it('should open overlay when toggle is called while closed', () => {
      component.toggle();

      expect(component.isOpen()).toBe(true);
    });

    it('should close overlay when toggle is called while open', () => {
      component.toggle(); // Open
      component.toggle(); // Close

      expect(component.isOpen()).toBe(false);
    });

    it('should refresh shortcuts list when opening', () => {
      component.toggle();

      expect(keyboardShortcutsService.getAll).toHaveBeenCalled();
      expect(component.shortcuts()).toEqual(mockShortcuts);
    });

    it('should not refresh shortcuts when closing', () => {
      component.toggle(); // Open
      keyboardShortcutsService.getAll.mockClear();
      component.toggle(); // Close

      expect(keyboardShortcutsService.getAll).not.toHaveBeenCalled();
    });
  });

  describe('Close behavior', () => {
    it('should close overlay when close is called', () => {
      component.toggle(); // Open first
      expect(component.isOpen()).toBe(true);

      component.close();

      expect(component.isOpen()).toBe(false);
    });

    it('should work when called while already closed', () => {
      component.close();

      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Rendering', () => {
    it('should not render overlay when closed', () => {
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.fixed');
      expect(overlay).toBeNull();
    });

    it('should render overlay when open', () => {
      component.toggle();
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.fixed');
      expect(overlay).toBeTruthy();
    });

    it('should render all shortcuts when open', () => {
      component.toggle();
      fixture.detectChanges();

      const shortcutItems = fixture.nativeElement.querySelectorAll('.py-2');
      expect(shortcutItems.length).toBe(mockShortcuts.length);
    });

    it('should display shortcut descriptions', () => {
      component.toggle();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Go to gallery');
      expect(text).toContain('Save image');
      expect(text).toContain('Redo');
    });

    it('should display Ctrl modifier for ctrl shortcuts', () => {
      component.toggle();
      fixture.detectChanges();

      const kbds = fixture.nativeElement.querySelectorAll('kbd');
      const kbdArray = Array.from(kbds) as Element[];
      const saveKbd = kbdArray.find((kbd) => kbd.textContent?.includes('Ctrl'));
      expect(saveKbd).toBeTruthy();
    });

    it('should display Shift modifier for shift shortcuts', () => {
      component.toggle();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Shift');
    });

    it('should display Alt modifier for alt shortcuts', () => {
      component.toggle();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Alt');
    });

    it('should display key in uppercase', () => {
      component.toggle();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('G');
      expect(text).toContain('S');
    });

    it('should close when backdrop is clicked', () => {
      component.toggle();
      fixture.detectChanges();

      const backdrop = fixture.nativeElement.querySelector('.fixed');
      backdrop.click();

      expect(component.isOpen()).toBe(false);
    });

    it('should not close when dialog content is clicked', () => {
      component.toggle();
      fixture.detectChanges();

      const dialogContent = fixture.nativeElement.querySelector('.bg-secondary-bg');
      dialogContent.click();

      expect(component.isOpen()).toBe(true);
    });

    it('should have close button', () => {
      component.toggle();
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close"]');
      expect(closeButton).toBeTruthy();
    });

    it('should close when close button is clicked', () => {
      component.toggle();
      fixture.detectChanges();

      const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close"]');
      closeButton.click();

      expect(component.isOpen()).toBe(false);
    });

    it('should render title', () => {
      component.toggle();
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Keyboard Shortcuts');
    });
  });

  describe('Meta key handling', () => {
    it('should display Ctrl for meta key shortcuts (Cmd on Mac)', () => {
      const metaShortcuts = [
        {
          id: 'meta-shortcut',
          config: {
            key: 'c',
            meta: true,
            description: 'Copy',
            handler: jest.fn(),
          } as ShortcutConfig,
        },
      ];

      keyboardShortcutsService.getAll.mockReturnValue(metaShortcuts);
      component.toggle();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Ctrl');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty shortcuts list', () => {
      keyboardShortcutsService.getAll.mockReturnValue([]);
      component.toggle();
      fixture.detectChanges();

      const shortcutItems = fixture.nativeElement.querySelectorAll('.py-2');
      expect(shortcutItems.length).toBe(0);
    });

    it('should handle shortcuts without modifiers', () => {
      const simpleShortcuts = [
        {
          id: 'simple',
          config: {
            key: 'f',
            description: 'Fullscreen',
            handler: jest.fn(),
          } as ShortcutConfig,
        },
      ];

      keyboardShortcutsService.getAll.mockReturnValue(simpleShortcuts);
      component.toggle();
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Fullscreen');
      expect(text).toContain('F');
    });
  });
});
