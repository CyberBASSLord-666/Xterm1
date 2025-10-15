import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import { webcrypto } from 'crypto';

setupZoneTestEnv();

// Provide a deterministic crypto implementation for tests so services relying on
// randomUUID behave consistently during coverage runs.
const cryptoInstance = webcrypto as unknown as Crypto;
const uuidBase = '00000000-0000-4000-8000-';
let uuidCounter = 0;
const nextUuid = (): `${string}-${string}-${string}-${string}-${string}` => {
  const suffix = uuidCounter.toString(16).padStart(12, '0');
  uuidCounter = (uuidCounter + 1) % 0x100000000000;
  return `${uuidBase}${suffix}`;
};

if (typeof cryptoInstance.randomUUID === 'function') {
  jest.spyOn(cryptoInstance, 'randomUUID').mockImplementation(nextUuid);
} else {
  (cryptoInstance as any).randomUUID = jest.fn(nextUuid);
}

Object.defineProperty(globalThis, 'crypto', {
  configurable: true,
  value: cryptoInstance,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock createImageBitmap
global.createImageBitmap = jest.fn().mockImplementation(() =>
  Promise.resolve({
    width: 100,
    height: 100,
    close: jest.fn(),
  } as any)
);

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock window.screen and window.innerWidth/innerHeight for DeviceService
Object.defineProperty(window, 'screen', {
  writable: true,
  configurable: true,
  value: {
    width: 1920,
    height: 1080,
  },
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

Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  configurable: true,
  value: 1,
});
