import { Injectable } from '@angular/core';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SanitizeHtmlOptions {
  allowedUriSchemes?: string[];
  allowRelativeUris?: boolean;
  enforceNoopener?: boolean;
  blockedTags?: string[];
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
   * Removes control characters including null bytes according to OWASP guidelines.
   */
  sanitizeString(input: string): string {
    const sanitized = ValidationService.stripControlCharacters(input);
    return sanitized.trim();
  }

  // Numeric ranges for C0 and C1 control characters as defined by the Unicode standard.
  private static readonly controlCharacterRanges: ReadonlyArray<readonly [number, number]> = [
    [0x00, 0x1f],
    [0x7f, 0x9f]
  ];

  private static readonly defaultAllowedTags: ReadonlySet<string> = new Set([
    'a',
    'b',
    'strong',
    'i',
    'em',
    'u',
    'p',
    'br',
    'span',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'blockquote'
  ]);

  private static readonly blockedTags: ReadonlySet<string> = new Set([
    'script',
    'style',
    'iframe',
    'object',
    'embed',
    'template',
    'link',
    'meta',
    'base'
  ]);

  private static readonly uriAttributes: ReadonlySet<string> = new Set(['href', 'src', 'xlink:href']);

  private static readonly defaultAllowedUriSchemes: ReadonlySet<string> = new Set(['http', 'https', 'blob']);

  private static readonly allowedTargetValues: ReadonlySet<string> = new Set(['_self', '_blank', '_parent', '_top']);

  private static readonly allowedRelTokens: ReadonlySet<string> = new Set([
    'alternate',
    'author',
    'external',
    'help',
    'license',
    'next',
    'nofollow',
    'noopener',
    'noreferrer',
    'prev',
    'ugc'
  ]);

  private static readonly safeClassPattern = /^[a-z0-9_-]+$/i;

  private static isControlCharacter(codePoint: number): boolean {
    return ValidationService.controlCharacterRanges.some(([start, end]) => codePoint >= start && codePoint <= end);
  }

  private static stripControlCharacters(input: string): string {
    let sanitized = '';

    for (const char of input) {
      const codePoint = char.codePointAt(0) ?? 0;
      if (ValidationService.isControlCharacter(codePoint)) {
        continue;
      }
      sanitized += char;
    }

    return sanitized;
  }

  /**
   * Sanitize HTML to prevent XSS attacks.
   * Production-grade implementation with comprehensive tag and attribute filtering.
   */
  sanitizeHtml(html: string): string {
    const allowedAttributes: Record<string, string[]> = {
      '*': [],
      'a': ['href', 'title', 'target', 'rel'],
      'span': ['class'],
      'code': ['class'],
      'pre': ['class'],
    };

    return this.sanitizeHtmlAdvanced(
      html,
      Array.from(ValidationService.defaultAllowedTags),
      allowedAttributes
    );
  }

  /**
   * Advanced HTML sanitization with whitelist approach.
   * Only allows specific safe tags and attributes.
   */
  sanitizeHtmlAdvanced(
    html: string,
    allowedTags: string[] = [],
    allowedAttributes: Record<string, string[]> = {},
    options: SanitizeHtmlOptions = {}
  ): string {
    const allowTagSet = new Set(allowedTags.map(tag => tag.toLowerCase()));
    const allowedAttributesMap = ValidationService.buildAttributeAllowMap(allowedAttributes);

    const sanitizationOptions: SanitizationOptions = {
      allowedUriSchemes: new Set(
        (options.allowedUriSchemes ?? Array.from(ValidationService.defaultAllowedUriSchemes)).map(scheme => scheme.toLowerCase())
      ),
      allowRelativeUris: options.allowRelativeUris ?? true,
      enforceNoopener: options.enforceNoopener ?? true,
      blockedTags: new Set([
        ...Array.from(ValidationService.blockedTags),
        ...((options.blockedTags ?? []).map(tag => tag.toLowerCase()))
      ])
    };

    return this.performDomSanitization(html, allowTagSet, allowedAttributesMap, sanitizationOptions);
  }

  private static buildAttributeAllowMap(record: Record<string, string[]>): AttributeAllowMap {
    const map = new Map<string, ReadonlySet<string>>();

    for (const [tag, attrs] of Object.entries(record)) {
      map.set(tag.toLowerCase(), new Set(attrs.map(attr => attr.toLowerCase())));
    }

    return map;
  }

  private static mergeAllowedAttributesForTag(
    allowedAttributes: AttributeAllowMap,
    tagName: string
  ): ReadonlySet<string> {
    const merged = new Set<string>();
    const globalAttrs = allowedAttributes.get('*');
    if (globalAttrs) {
      globalAttrs.forEach(attr => merged.add(attr));
    }
    const tagAttrs = allowedAttributes.get(tagName);
    if (tagAttrs) {
      tagAttrs.forEach(attr => merged.add(attr));
    }
    return merged;
  }

  private performDomSanitization(
    html: string,
    allowedTags: ReadonlySet<string>,
    allowedAttributes: AttributeAllowMap,
    options: SanitizationOptions
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fragment = document.createDocumentFragment();

    for (const child of Array.from(doc.body.childNodes)) {
      const sanitizedChild = this.sanitizeNode(child, allowedTags, allowedAttributes, options);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    }

    const container = document.createElement('div');
    container.appendChild(fragment);
    return container.innerHTML;
  }

  private sanitizeNode(
    node: Node,
    allowedTags: ReadonlySet<string>,
    allowedAttributes: AttributeAllowMap,
    options: SanitizationOptions
  ): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const sanitizedText = ValidationService.stripControlCharacters(node.textContent ?? '');
      return document.createTextNode(sanitizedText);
    }

    if (node.nodeType === Node.COMMENT_NODE) {
      return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      if (options.blockedTags.has(tagName)) {
        return null;
      }

      if (!allowedTags.has(tagName)) {
        return this.sanitizeChildNodes(element, allowedTags, allowedAttributes, options);
      }

      const sanitizedElement = document.createElement(tagName);
      const allowedAttrNames = ValidationService.mergeAllowedAttributesForTag(allowedAttributes, tagName);

      for (const attr of Array.from(element.attributes)) {
        const attrName = attr.name.toLowerCase();
        if (!allowedAttrNames.has(attrName)) {
          continue;
        }

        const attrValue = ValidationService.stripControlCharacters(attr.value.trim());

        if (ValidationService.uriAttributes.has(attrName)) {
          if (!this.isAllowedUri(attrValue, options)) {
            continue;
          }
          sanitizedElement.setAttribute(attrName, attrValue);
          continue;
        }

        if (attrName === 'class') {
          const sanitizedClass = this.sanitizeClassAttribute(attrValue);
          if (sanitizedClass) {
            sanitizedElement.setAttribute('class', sanitizedClass);
          }
          continue;
        }

        if (attrName === 'target') {
          const sanitizedTarget = this.sanitizeTargetAttribute(attrValue, allowedAttrNames, options);
          if (sanitizedTarget) {
            sanitizedElement.setAttribute('target', sanitizedTarget);
          }
          continue;
        }

        if (attrName === 'rel') {
          const sanitizedRel = this.sanitizeRelAttribute(attrValue);
          if (sanitizedRel) {
            sanitizedElement.setAttribute('rel', sanitizedRel);
          }
          continue;
        }

        if (attrValue.length > 0) {
          sanitizedElement.setAttribute(attrName, attrValue);
        }
      }

      if (sanitizedElement.hasAttribute('target')) {
        const targetValue = sanitizedElement.getAttribute('target');
        if (targetValue === '_blank' && options.enforceNoopener) {
          const enforcedRel = this.ensureRelNoopener(sanitizedElement.getAttribute('rel') ?? '');
          sanitizedElement.setAttribute('rel', enforcedRel);
        }
      }

      const sanitizedChildren = this.sanitizeChildNodes(element, allowedTags, allowedAttributes, options);
      if (sanitizedChildren) {
        sanitizedElement.appendChild(sanitizedChildren);
      }

      return sanitizedElement;
    }

    return null;
  }

  private sanitizeChildNodes(
    element: Element,
    allowedTags: ReadonlySet<string>,
    allowedAttributes: AttributeAllowMap,
    options: SanitizationOptions
  ): DocumentFragment | null {
    const fragment = document.createDocumentFragment();

    for (const child of Array.from(element.childNodes)) {
      const sanitizedChild = this.sanitizeNode(child, allowedTags, allowedAttributes, options);
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild);
      }
    }

    return fragment.childNodes.length > 0 ? fragment : null;
  }

  private isAllowedUri(value: string, options: SanitizationOptions): boolean {
    if (!value) {
      return false;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return false;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      if (!options.allowRelativeUris) {
        return false;
      }

      return trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.startsWith('#');
    }

    const scheme = trimmed.slice(0, colonIndex).toLowerCase();
    if (!options.allowedUriSchemes.has(scheme)) {
      return false;
    }

    if (scheme === 'data') {
      return false;
    }

    return true;
  }

  private sanitizeClassAttribute(value: string): string | null {
    const classes = value.split(/\s+/).filter(Boolean);
    if (classes.length === 0) {
      return null;
    }

    const sanitizedClasses: string[] = [];
    const seen = new Set<string>();

    for (const cls of classes) {
      if (!ValidationService.safeClassPattern.test(cls)) {
        continue;
      }

      const lower = cls.toLowerCase();
      if (seen.has(lower)) {
        continue;
      }

      seen.add(lower);
      sanitizedClasses.push(cls);
    }

    return sanitizedClasses.length > 0 ? sanitizedClasses.join(' ') : null;
  }

  private sanitizeTargetAttribute(
    value: string,
    allowedAttrNames: ReadonlySet<string>,
    options: SanitizationOptions
  ): string | null {
    const normalized = value.trim().toLowerCase();

    if (!ValidationService.allowedTargetValues.has(normalized)) {
      return null;
    }

    if (normalized === '_blank' && options.enforceNoopener && !allowedAttrNames.has('rel')) {
      return null;
    }

    return normalized;
  }

  private sanitizeRelAttribute(value: string): string | null {
    const tokens = value.split(/\s+/).filter(Boolean).map(token => token.toLowerCase());
    if (tokens.length === 0) {
      return null;
    }

    const filtered: string[] = [];
    const seen = new Set<string>();

    for (const token of tokens) {
      if (!ValidationService.allowedRelTokens.has(token)) {
        continue;
      }

      if (!seen.has(token)) {
        seen.add(token);
        filtered.push(token);
      }
    }

    return filtered.length > 0 ? filtered.join(' ') : null;
  }

  private ensureRelNoopener(value: string): string {
    const tokens = value.split(/\s+/).filter(Boolean).map(token => token.toLowerCase());
    tokens.push('noopener', 'noreferrer');

    const filtered: string[] = [];
    const seen = new Set<string>();

    for (const token of tokens) {
      if (!ValidationService.allowedRelTokens.has(token)) {
        continue;
      }

      if (!seen.has(token)) {
        seen.add(token);
        filtered.push(token);
      }
    }

    if (!seen.has('noopener')) {
      filtered.push('noopener');
    }

    if (!seen.has('noreferrer')) {
      filtered.push('noreferrer');
    }

    return filtered.join(' ');
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

interface SanitizationOptions {
  allowedUriSchemes: Set<string>;
  allowRelativeUris: boolean;
  enforceNoopener: boolean;
  blockedTags: Set<string>;
}

type AttributeAllowMap = ReadonlyMap<string, ReadonlySet<string>>;
