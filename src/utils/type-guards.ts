/**
 * Type Guard Utilities
 * Centralized type guards for runtime type checking
 */

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Check if value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return isObject(error) && 'message' in error && isString(error.message);
}

/**
 * Check if error has a code property
 */
export function hasCode(error: unknown): error is { code: string | number } {
  return isObject(error) && 'code' in error;
}

/**
 * Check if error has a name property
 */
export function hasName(error: unknown): error is { name: string } {
  return isObject(error) && 'name' in error && isString(error.name);
}

/**
 * Extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isString(error)) {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (hasMessage(error)) {
    return error.message;
  }

  if (isObject(error) && 'error' in error && hasMessage(error.error)) {
    return error.error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Check if value is a valid URL string
 */
export function isValidUrl(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is a valid email string
 */
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Type guard for HTMLElement
 */
export function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

/**
 * Type guard for Event
 */
export function isEvent(value: unknown): value is Event {
  return value instanceof Event;
}
