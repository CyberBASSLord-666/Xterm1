import { Injectable } from '@angular/core';
import sanitizeHtml from 'sanitize-html';

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
   * Helper to repeatedly remove matches for a pattern until the string stabilizes.
   */
  private replaceRepeatedly(input: string, regex: RegExp, replacement: string): string {
    let previous: string;
    do {
      previous = input;
      input = input.replace(regex, replacement);
    } while (input !== previous);
    return input;
  }

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
   * Removes control characters including null bytes according to OWASP guidelines.
   * Handles Unicode normalization and multi-byte character attacks.
   */
  sanitizeString(input: string): string {
    // Normalize Unicode to prevent homograph attacks and combining character exploits
    // NFC (Canonical Decomposition, followed by Canonical Composition)
    let sanitized = input.normalize('NFC');

    // Remove null bytes and control characters (C0 and C1 control codes)
    // This is intentional and necessary for security - not a lint error
    // References: OWASP Input Validation Cheat Sheet
    // Control characters can cause injection attacks and data corruption
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Remove zero-width characters that can be used for obfuscation
    sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Remove directional override characters (can be used for spoofing)
    sanitized = sanitized.replace(/[\u202A-\u202E]/g, '');

    // Remove other invisible Unicode characters
    sanitized = sanitized.replace(/[\u2060-\u2069]/g, '');

    // Remove Unicode line/paragraph separators
    sanitized = sanitized.replace(/[\u2028\u2029]/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove multiple consecutive spaces
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Sanitize HTML to prevent XSS attacks.
   * Production-grade implementation with comprehensive tag and attribute filtering.
   * Uses multiple layers of defense to prevent XSS including encoded attacks.
   */
  sanitizeHtml(html: string): string {
    // First escape all HTML
    const div = document.createElement('div');
    div.textContent = html;
    let sanitized = div.innerHTML;

    // Define allowed tags and attributes for rich text (if needed)
    // Reserved for future whitelist-based filtering
    const _allowedTags = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span'];
    const _allowedAttributes: Record<string, string[]> = {
      span: ['class'],
      a: ['href', 'title'], // Only if links are needed
    };

    // For most use cases, we want plain text with HTML escaped
    // This prevents ALL XSS attacks including attribute-based attacks

    // Sanitize HTML using well-tested library
    sanitized = sanitizeHtml(sanitized, {
      allowedTags: [], // Remove all tags for maximum safety
      allowedAttributes: {}, // Remove all attributes
    });

    // Remove ALL event handlers with comprehensive patterns
    // Match on*, ON*, oN*, etc. with various attribute formats
    sanitized = this.replaceRepeatedly(sanitized, /\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = this.replaceRepeatedly(sanitized, /\s*on\w+\s*=\s*[^\s>]*/gi, '');
    sanitized = this.replaceRepeatedly(sanitized, /\s*ON\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = this.replaceRepeatedly(sanitized, /\s*ON\w+\s*=\s*[^\s>]*/gi, '');

    // Remove dangerous protocols with comprehensive pattern matching
    // Include URL-encoded variations and HTML entity encodings
    const dangerousProtocols = [
      'javascript:',
      'javascript&colon;',
      'javascript&#58;',
      'javascript&#x3a;',
      'data:',
      'data&colon;',
      'data&#58;',
      'data&#x3a;',
      'vbscript:',
      'vbscript&colon;',
      'vbscript&#58;',
      'vbscript&#x3a;',
      'file:',
      'about:',
    ];

    for (const protocol of dangerousProtocols) {
      const regex = new RegExp(protocol.replace(':', '\\s*:\\s*'), 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    // Remove any suspicious attribute patterns including encoded forms
    sanitized = sanitized.replace(
      /\s*style\s*=\s*["'][^"']*(expression|behavior|binding|import|@import)[^"']*["']/gi,
      ''
    );

    // Remove CSS url() with dangerous protocols
    sanitized = sanitized.replace(
      /url\s*\(\s*['"]?\s*(?:javascript:|data:|vbscript:)[^)]*['"]?\s*\)/gi,
      ''
    );

    // Remove meta and link tags that could refresh or redirect
    sanitized = sanitized.replace(/<meta[\s\S]*?>/gi, '');
    sanitized = sanitized.replace(/<link[\s\S]*?>/gi, '');

    // Remove base tag that could hijack relative URLs
    sanitized = sanitized.replace(/<base[\s\S]*?>/gi, '');
    
    return sanitized;
  }

  /**
   * Advanced HTML sanitization with whitelist approach.
   * Only allows specific safe tags and attributes.
   */
  sanitizeHtmlAdvanced(
    html: string,
    allowedTags: string[] = [],
    allowedAttributes: Record<string, string[]> = {}
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sanitize = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        // If tag is not allowed, return its text content
        if (!allowedTags.includes(tagName)) {
          return document.createTextNode(element.textContent || '');
        }

        // Create new element with same tag
        const newElement = document.createElement(tagName);

        // Copy only allowed attributes
        const allowedAttrs = allowedAttributes[tagName] || [];
        for (const attr of Array.from(element.attributes)) {
          if (allowedAttrs.includes(attr.name)) {
            // Additional validation for href attributes
            if (attr.name === 'href') {
              const href = attr.value.trim().toLowerCase();
              // Comprehensive URL scheme validation to prevent XSS
              // Block dangerous protocols: javascript:, data:, vbscript:, file:, etc.
              const dangerousProtocols = [
                'javascript:',
                'data:',
                'vbscript:',
                'file:',
                'about:',
                'javascript&colon;',
                'data&colon;',
                'vbscript&colon;',
              ];

              // Check if href contains any dangerous protocol
              const hasDangerousProtocol = dangerousProtocols.some((protocol) =>
                href.includes(protocol)
              );

              if (!hasDangerousProtocol) {
                // Only allow http, https, mailto, and relative URLs
                if (
                  href.startsWith('http://') ||
                  href.startsWith('https://') ||
                  href.startsWith('mailto:') ||
                  href.startsWith('/') ||
                  href.startsWith('./') ||
                  href.startsWith('../') ||
                  (href.startsWith('#') && !href.includes('javascript'))
                ) {
                  newElement.setAttribute(attr.name, attr.value);
                }
              }
            } else {
              newElement.setAttribute(attr.name, attr.value);
            }
          }
        }

        // Recursively sanitize children
        for (const child of Array.from(node.childNodes)) {
          const sanitizedChild = sanitize(child);
          if (sanitizedChild) {
            newElement.appendChild(sanitizedChild);
          }
        }

        return newElement;
      }

      return null;
    };

    const sanitizedBody = sanitize(doc.body);
    return sanitizedBody ? sanitizedBody.textContent || '' : '';
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

  /**
   * Comprehensive URL sanitization to prevent XSS and other attacks.
   * Validates and sanitizes URLs by checking for dangerous protocols and patterns.
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';

    // Normalize the URL
    const normalized = url.trim().toLowerCase();

    // List of dangerous protocols including encoded variations
    const dangerousProtocols = [
      'javascript:',
      'javascript&colon;',
      'javascript&#58;',
      'javascript&#x3a;',
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
    ];

    // Check if URL contains any dangerous protocol
    for (const protocol of dangerousProtocols) {
      if (normalized.includes(protocol)) {
        return ''; // Return empty string for dangerous URLs
      }
    }

    // Additional check for URL-encoded attacks
    try {
      const decoded = decodeURIComponent(url);
      const decodedLower = decoded.toLowerCase();
      for (const protocol of dangerousProtocols) {
        if (decodedLower.includes(protocol)) {
          return ''; // Return empty string for dangerous URLs
        }
      }
    } catch (e) {
      // If decoding fails, the URL might be malformed
      return '';
    }

    // Validate URL format
    try {
      const parsed = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'mailto:', 'blob:'];

      if (!allowedProtocols.includes(parsed.protocol)) {
        return ''; // Only allow safe protocols
      }

      return url; // Return original URL if safe
    } catch (e) {
      // If it's a relative URL, check it doesn't contain dangerous patterns
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        // Check for dangerous patterns in relative URLs
        if (
          normalized.includes('javascript:') ||
          normalized.includes('data:') ||
          normalized.includes('vbscript:')
        ) {
          return '';
        }
        return url;
      }
      return ''; // Invalid URL format
    }
  }

  /**
   * Validate and sanitize a filename to prevent directory traversal and other attacks.
   */
  sanitizeFilename(filename: string): string {
    if (!filename) return '';

    // Remove path separators to prevent directory traversal
    let sanitized = filename.replace(/[/\\]/g, '');

    // Remove null bytes
    sanitized = sanitized.replace(/\x00/g, '');

    // Remove leading dots to prevent hidden files
    sanitized = sanitized.replace(/^\.+/, '');

    // Limit to alphanumeric, dash, underscore, and dot
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Ensure filename is not empty after sanitization
    if (sanitized.length === 0) {
      sanitized = 'file';
    }

    // Limit filename length
    if (sanitized.length > 255) {
      sanitized = sanitized.substring(0, 255);
    }

    return sanitized;
  }
}
