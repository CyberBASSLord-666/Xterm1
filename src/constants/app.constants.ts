/**
 * Application Constants
 * Centralized configuration values to eliminate magic numbers and strings
 */

/** API Configuration */
export const API_CONFIG = {
  /** Pollinations Image API base URL */
  IMAGE_API_BASE: 'https://image.pollinations.ai/prompt',
  /** Pollinations Text API base URL */
  TEXT_API_BASE: 'https://text.pollinations.ai',
  /** Image API request interval (milliseconds) */
  IMAGE_INTERVAL: 5000,
  /** Text API request interval (milliseconds) */
  TEXT_INTERVAL: 3000,
  /** Default retry attempts for failed requests */
  DEFAULT_RETRIES: 3,
  /** Request timeout (milliseconds) */
  REQUEST_TIMEOUT: 30000,
} as const;

/** Cache Configuration */
export const CACHE_CONFIG = {
  /** Default cache TTL (milliseconds) - 5 minutes */
  DEFAULT_TTL: 5 * 60 * 1000,
  /** Maximum cache size (number of entries) */
  MAX_CACHE_SIZE: 100,
  /** Gallery thumbnail cache TTL (milliseconds) - 30 minutes */
  THUMBNAIL_TTL: 30 * 60 * 1000,
} as const;

/** Performance Configuration */
export const PERFORMANCE_CONFIG = {
  /** Debounce delay for input events (milliseconds) */
  INPUT_DEBOUNCE: 300,
  /** Throttle delay for scroll events (milliseconds) */
  SCROLL_THROTTLE: 100,
  /** Maximum queue size for analytics events */
  MAX_ANALYTICS_QUEUE: 100,
  /** Idle callback timeout (milliseconds) */
  IDLE_CALLBACK_TIMEOUT: 5000,
} as const;

/** UI Configuration */
export const UI_CONFIG = {
  /** Toast display duration (milliseconds) */
  TOAST_DURATION: 4000,
  /** Animation duration (milliseconds) */
  ANIMATION_DURATION: 300,
  /** Maximum prompt length */
  MAX_PROMPT_LENGTH: 1000,
  /** Maximum history items to store */
  MAX_HISTORY_ITEMS: 20,
  /** Generation status message interval (milliseconds) */
  GENERATION_MESSAGE_INTERVAL: 2500,
} as const;

/** Validation Rules */
export const VALIDATION_RULES = {
  /** Allowed URL protocols */
  ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:', 'blob:'] as const,
  /** Allowed URL schemes (without colon) for sanitizer */
  ALLOWED_SCHEMES: ['http', 'https', 'mailto', 'blob'] as const,
  /** Dangerous protocol markers for XSS prevention */
  DANGEROUS_PROTOCOLS: [
    'javascript:',
    'javascript&colon;',
    'javascript&#58;',
    'javascript&#x3a;',
    'javascript&#x003a;',
    'data:',
    'data&colon;',
    'data&#58;',
    'data&#x3a;',
    'vbscript:',
    'vbscript&colon;',
    'vbscript&#58;',
    'vbscript&#x3a;',
    'file:',
    'file&colon;',
    'about:',
    'about&colon;',
  ] as const,
  /** Maximum file size for uploads (bytes) - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed image MIME types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,
  /** Maximum prompt length */
  MAX_PROMPT_LENGTH: 2000,
  /** Maximum special character ratio in prompt */
  MAX_SPECIAL_CHAR_RATIO: 0.3,
  /** Maximum filename length */
  MAX_FILENAME_LENGTH: 255,
} as const;

/** Accessibility Configuration */
export const ACCESSIBILITY_CONFIG = {
  /** Focusable elements selector */
  FOCUSABLE_ELEMENTS: [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', '),
  /** Minimum color contrast ratio (WCAG AA) */
  MIN_CONTRAST_RATIO: 4.5,
} as const;

/** Storage Keys */
export const STORAGE_KEYS = {
  /** Settings storage key */
  SETTINGS: 'polliwall_settings',
  /** Gallery storage key */
  GALLERY: 'polliwall_gallery',
  /** Collections storage key */
  COLLECTIONS: 'polliwall_collections',
  /** Prompt history storage key */
  PROMPT_HISTORY: 'polliwall_prompt_history',
} as const;

/** Error Messages */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  TIMEOUT_ERROR: 'The request took too long. Please try again.',
  RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment before trying again.',
  SERVER_ERROR: 'The service is temporarily unavailable. Please try again later.',
  AUTH_ERROR: 'Authentication failed. Please check your API key.',
  VALIDATION_ERROR: 'Invalid input. Please check your data.',
  UNKNOWN_ERROR: 'An error occurred. Please try again.',
  GENERATION_IN_PROGRESS: 'A generation is already in progress.',
  PROMPT_EMPTY: 'Prompt cannot be empty',
  PROMPT_TOO_LONG: 'Prompt is too long (maximum 2000 characters)',
  PROMPT_SPECIAL_CHARS: 'Prompt contains too many special characters',
  FILENAME_INVALID: 'Filename contains invalid characters',
  FILENAME_TOO_LONG: 'Filename is too long',
  URL_INVALID: 'Invalid URL format',
  URL_DANGEROUS_PROTOCOL: 'URL contains dangerous protocol',
} as const;

/** Feature Flags */
export const FEATURE_FLAGS = {
  /** Enable analytics tracking */
  ENABLE_ANALYTICS: true,
  /** Enable performance monitoring */
  ENABLE_PERFORMANCE_MONITORING: true,
  /** Enable accessibility audit on dev */
  ENABLE_A11Y_AUDIT: false,
  /** Enable experimental features */
  ENABLE_EXPERIMENTAL: false,
} as const;

/** Image Generation Presets */
export const IMAGE_PRESETS = {
  MODELS: {
    DEFAULT: 'flux',
    FALLBACK: 'flux',
    WHITELIST: [
      'flux',
      'sdxl',
      'playground-v2.5',
      'dall-e-3',
      'dall-e-2',
      'stable-diffusion-2.1',
      'turbo',
      'dreamshaper',
      'realvisxl',
    ],
  },
  ASPECT_RATIOS: {
    SQUARE: '1:1',
    LANDSCAPE: '16:9',
    PORTRAIT: '9:16',
    WIDE: '21:9',
  },
  /** Default thumbnail size (pixels) */
  THUMBNAIL_SIZE: 320,
  /** Default thumbnail quality (0-1) */
  THUMBNAIL_QUALITY: 0.85,
  /** Default compression quality (0-1) */
  COMPRESSION_QUALITY: 0.85,
  /** Maximum image width for compression (pixels) */
  MAX_IMAGE_WIDTH: 2048,
  /** Maximum image height for compression (pixels) */
  MAX_IMAGE_HEIGHT: 2048,
  /** Generation status messages */
  GENERATION_MESSAGES: [
    'Connecting to generative matrix',
    'Injecting prompt into AI core',
    'Weaving pixels from raw chaos',
    'Applying hyperrealistic textures',
    'Focusing light particles',
    'Rendering final details',
  ] as const,
} as const;

/** Type exports for const assertions */
export type AllowedProtocol = (typeof VALIDATION_RULES.ALLOWED_PROTOCOLS)[number];
export type ImageModel = (typeof IMAGE_PRESETS.MODELS.WHITELIST)[number];
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
