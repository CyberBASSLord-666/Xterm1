import { TestBed } from '@angular/core/testing';
import { DeviceService } from '../device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    // Setup mock window properties
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    });

    TestBed.configureTestingModule({
      providers: [DeviceService],
    });
    service = TestBed.inject(DeviceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return device info with width, height, and dpr', () => {
    // Re-set mocks to be sure
    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: {
        width: 1920,
        height: 1080,
      },
    });

    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2,
    });

    const info = service.getInfo();

    expect(info).toBeDefined();
    expect(info.width).toBeGreaterThan(0);
    expect(info.height).toBeGreaterThan(0);
    expect(info.dpr).toBeGreaterThan(0);
  });

  it('should calculate width and height based on device pixel ratio', () => {
    const mockDpr = 2;
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: mockDpr,
    });

    Object.defineProperty(window.screen, 'width', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    Object.defineProperty(window.screen, 'height', {
      writable: true,
      configurable: true,
      value: 1080,
    });

    const info = service.getInfo();

    expect(info.width).toBe(Math.round(1920 * mockDpr));
    expect(info.height).toBe(Math.round(1080 * mockDpr));
    expect(info.dpr).toBe(mockDpr);
  });

  it('should default to window inner dimensions if screen is not available', () => {
    const originalScreen = window.screen;
    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const info = service.getInfo();

    expect(info.width).toBeGreaterThan(0);
    expect(info.height).toBeGreaterThan(0);

    // Restore
    Object.defineProperty(window, 'screen', {
      writable: true,
      configurable: true,
      value: originalScreen,
    });
  });

  it('should default to dpr of 1 if devicePixelRatio is not available', () => {
    const originalDpr = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const info = service.getInfo();

    expect(info.dpr).toBe(1);

    // Restore
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: originalDpr,
    });
  });
});
