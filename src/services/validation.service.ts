import { Injectable } from '@angular/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Service for input validation and sanitization.
 */
@Injectable({ providedIn: 'root' })
export class ValidationService {
  /**
   * Validate a prompt string.
   */
  validatePrompt(prompt: string): ValidationResult {
    const errors: string[] = [];

    if (!prompt || prompt.trim().length === 0) {
      errors.push('Prompt cannot be empty');
    }

    if (prompt && prompt.length > 2000) {
      errors.push('Prompt is too long (maximum 2000 characters)');
    }

    // Check for excessive special characters that might cause issues
    const specialCharRatio = (prompt.match(/[^a-zA-Z0-9\s,.!?-]/g) || []).length / prompt.length;
    if (specialCharRatio > 0.3) {
      errors.push('Prompt contains too many special characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate an image URL.
   */
  validateImageUrl(url: string): ValidationResult {
    const errors: string[] = [];

    if (!url || url.trim().length === 0) {
      errors.push('URL cannot be empty');
    }

    // Check if it's a valid URL (either http/https or blob)
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:', 'blob:'].includes(parsed.protocol)) {
        errors.push('URL must use http, https, or blob protocol');
      }
    } catch (e) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a seed number.
   */
  validateSeed(seed: number | undefined): ValidationResult {
    const errors: string[] = [];

    if (seed !== undefined) {
      if (!Number.isInteger(seed)) {
        errors.push('Seed must be an integer');
      }

      if (seed < 0) {
        errors.push('Seed must be a positive number');
      }

      if (seed > Number.MAX_SAFE_INTEGER) {
        errors.push('Seed is too large');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate image dimensions.
   */
  validateDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];

    if (width <= 0 || height <= 0) {
      errors.push('Dimensions must be positive numbers');
    }

    if (width > 8192 || height > 8192) {
      errors.push('Dimensions are too large (maximum 8192px)');
    }

    if (width < 64 || height < 64) {
      errors.push('Dimensions are too small (minimum 64px)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize a string by removing potentially dangerous characters.
   */
  sanitizeString(input: string): string {
    // Remove null bytes and control characters
    return input.replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Sanitize HTML to prevent XSS attacks.
   * This is a basic implementation; for production use a library like DOMPurify.
   */
  sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Validate an API key format.
   */
  validateApiKey(key: string): ValidationResult {
    const errors: string[] = [];

    if (!key || key.trim().length === 0) {
      errors.push('API key cannot be empty');
    }

    if (key && key.length < 20) {
      errors.push('API key appears to be too short');
    }

    // Basic check for common patterns (this is very basic)
    if (key && !/^[A-Za-z0-9_-]+$/.test(key)) {
      errors.push('API key contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
