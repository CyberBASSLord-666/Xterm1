import 'jest-preset-angular/setup-jest';

 copilot/fix-cb260cd0-e9f5-43c9-819f-ea0ef53a3483
// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
 main
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
 copilot/fix-cb260cd0-e9f5-43c9-819f-ea0ef53a3483

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
 main
