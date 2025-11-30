/**
 * Jest Setup Configuration for PolliWall (Xterm1)
 *
 * This file configures the Jest testing environment with necessary mocks
 * and polyfills for Angular testing in a Node.js environment.
 *
 * QA NOTES:
 * - Zone.js setup is required for Angular change detection in tests
 * - Browser API mocks ensure tests run consistently in Node.js
 * - All mocks return predictable values for deterministic tests
 *
 * MOCKED APIS:
 * - matchMedia: Theme detection and responsive design
 * - IntersectionObserver: Lazy loading and visibility detection
 * - ResizeObserver: Element resize monitoring
 * - createImageBitmap: Image processing
 * - URL.createObjectURL/revokeObjectURL: Blob URL management
 * - crypto.randomUUID: Unique ID generation
 *
 * @see jest.config.ts for Jest configuration
 * @see TEST_COVERAGE.md for testing strategy
 */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Initialize Angular Zone.js testing environment
setupZoneTestEnv();

/**
 * Mock matchMedia API
 * Used for theme detection and responsive breakpoints
 * Returns false for all queries by default (light mode, desktop)
 */
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

/**
 * Mock IntersectionObserver API
 * Used for lazy loading components and visibility-based triggers
 * No-op implementation for test environment
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

/**
 * Mock ResizeObserver API
 * Used for element resize monitoring (e.g., responsive components)
 * No-op implementation for test environment
 */
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

/**
 * Mock createImageBitmap API
 * Used for image processing and optimization
 * Returns a predictable mock image bitmap
 */
global.createImageBitmap = jest.fn().mockImplementation(() =>
  Promise.resolve({
    width: 100,
    height: 100,
    close: jest.fn(),
  } as any)
);

/**
 * Mock URL.createObjectURL and revokeObjectURL APIs
 * Used for Blob URL management (image preview, downloads)
 * Returns a predictable mock URL
 */
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

/**
 * Mock crypto.randomUUID API
 * Used for generating unique identifiers
 * Returns a predictable UUID format for deterministic tests
 */
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: jest.fn(() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }),
    },
  });
}
