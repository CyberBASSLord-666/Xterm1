import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';
import sanitizeHtmlLib from 'sanitize-html';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Service for input validation and sanitization (defense-in-depth).
 * - String hygiene (Unicode normalization, control char stripping)
 * - URL validation/sanitization (protocol allowlist + decoding checks)
 * - HTML sanitization (library first; optional whitelist mode)
 * - Filename hardening (path traversal, reserved names, null bytes)
 *
 * Notes:
 * - Uses Angular's DomSanitizer for an additional security boundary when binding to [innerHTML].
 * - Avoids DOM access paths in core methods so it works in SSR; whitelist mode falls back safely.
 */
@Injectable({ providedIn: 'root' })
export class ValidationService {
  private readonly domSanitizer = inject(DomSanitizer);

  /**
   * Replace matches repeatedly until input stabilizes.
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
   * Validate a free-form prompt.
   */
  validatePrompt(prompt: string): ValidationResult {
    const errors: string[] = [];

    const value = (prompt ?? '').trim();

    if (value.length === 0) {
      errors.push('Prompt cannot be empty');
    }

    if (value.length > 2000) {
      errors.push('Prompt is too long (maximum 2000 characters)');
    }

    // Only compute special char ratio when length is non-zero to avoid div-by-zero.
    if (value.length > 0) {
      const specials = (value.match(/[^a-zA-Z0-9\s,.!?-]/g) || []).length;
      const specialCharRatio = specials / value.length;
      if (specialCharRatio > 0.3) {
        errors.push('Prompt contains too many special characters');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate an image URL (http/https/blob) with structural checks.
   */
  validateImageUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const value = (url ?? '').trim();

    if (value.length === 0) {
      errors.push('URL cannot be empty');
      return { isValid: false, errors };
    }

    try {
      const parsed = new URL(value);
      if (!['http:', 'https:', 'blob:'].includes(parsed.protocol)) {
        errors.push('URL must use http, https, or blob protocol');
      }
    } catch {
      errors.push('Invalid URL format');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate an optional integer seed.
   */
  validateSeed(seed: number | undefined): ValidationResult {
    const errors: string[] = [];
    if (seed !== undefined) {
      if (!Number.isInteger(seed)) errors.push('Seed must be an integer');
      if (typeof seed === 'number' && seed < 0) errors.push('Seed must be a positive number');
      if (typeof seed === 'number' && seed > Number.MAX_SAFE_INTEGER) errors.push('Seed is too large');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate image dimensions within bounds.
   */
  validateDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];

    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      errors.push('Dimensions must be positive numbers');
    } else {
      if (width > 8192 || height > 8192) errors.push('Dimensions are too large (maximum 8192px)');
      if (width < 64 || height < 64) errors.push('Dimensions are too small (minimum 64px)');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * String hygiene: normalize & strip dangerous/invisible code points.
   * - NFC normalization guards combining char tricks.
   * - Remove C0/C1 control chars, nulls, zero-width, bidi overrides, etc.
   */
  sanitizeString(input: string): string {
    let sanitized = (input ?? '').normalize('NFC');

    // Control chars (C0/C1) including nulls.
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Zero-width & format characters often abused for obfuscation.
    sanitized = sanitized.replace(/[\u200B-\u200F\uFEFF]/g, ''); // ZWSP, ZWJ, ZWNJ, LRM, RLM, BOM

    // Bidi overrides / isolates
    sanitized = sanitized.replace(/[\u202A-\u202E\u2060-\u2069]/g, '');

    // Unicode line/paragraph separators
    sanitized = sanitized.replace(/[\u2028\u2029]/g, '');

    // Collapse whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Strict HTML sanitization to plain text (no tags retained).
   * Defense-in-depth:
   *  - Layer 1: sanitize-html library removes all tags/attrs.
   *  - Layers 2–4: extra scrubbing for protocol keywords & CSS url() patterns that could
   *    survive via encoding in text contexts or downstream re-interpretation.
   */
  sanitizeHtml(html: string): string {
    const raw = (html ?? '').trim();
    if (raw.length === 0) return '';

    // 1) Library pass: strip all tags & attributes (plain text result)
    let sanitized = sanitizeHtmlLib(raw, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
      allowedSchemes: ['http', 'https', 'mailto'],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
      allowProtocolRelative: false,
    });

    // 2) Remove event handler intent strings (defensive; mostly irrelevant when tags are gone)
    sanitized = this.replaceRepeatedly(sanitized, /\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = this.replaceRepeatedly(sanitized, /\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // 3) Nuke dangerous protocols (including encoded/colon variants) found in text
    const dangerous = [
      'javascript:', 'javascript&colon;', 'javascript&#58;', 'javascript&#x3a;', 'javascript&#x003a;',
      'data:', 'data&colon;', 'data&#58;', 'data&#x3a;',
      'vbscript:', 'vbscript&colon;', 'vbscript&#58;', 'vbscript&#x3a;',
      'file:', 'about:',
    ];
    for (const proto of dangerous) {
      const pattern = proto.replace(':', '\\s*:\\s*'); // be tolerant to whitespace around colon
      sanitized = this.replaceRepeatedly(sanitized, new RegExp(pattern, 'gi'), '');
    }

    // 4) Remove CSS url() with dangerous protocols if somehow present in text
    sanitized = sanitized.replace(
      /url\s*\(\s*['"]?\s*(?:javascript:|data:|vbscript:)[^)]*['"]?\s*\)/gi,
      ''
    );

    return sanitized;
  }

  /**
   * Prepare sanitized HTML for safe Angular rendering.
   * Use this result for [innerHTML]; Angular will still apply its security checks.
   */
  sanitizeHtmlForAngular(html: string): string {
    const plain = this.sanitizeHtml(html);
    return this.domSanitizer.sanitize(SecurityContext.HTML, plain) ?? '';
  }

  /**
   * Whitelist-based HTML sanitizer that preserves allowed markup.
   * - In browser: DOMParser traversal with attribute-level filtering.
   * - In SSR / no DOM: falls back to sanitize-html with equivalent allowlist.
   *
   * @param html Raw HTML
   * @param allowedTags Allowed element names (lowercase)
   * @param allowedAttributes Map of tag -> allowed attribute names (lowercase). Use '*' for global.
   * @returns Sanitized HTML string limited to the allowlist.
   */
  sanitizeHtmlAdvanced(
    html: string,
    allowedTags: string[] = [],
    allowedAttributes: Record<string, string[]> = {}
  ): string {
    const raw = (html ?? '').trim();
    if (raw.length === 0) return '';

    // If no tags allowed, reuse strict plain-text sanitizer.
    if (allowedTags.length === 0) return this.sanitizeHtml(raw);

    // SSR-safe fallback when DOM APIs are not available
    const hasDom = typeof window !== 'undefined' && typeof DOMParser !== 'undefined';
    if (!hasDom) {
      return sanitizeHtmlLib(raw, {
        allowedTags,
        allowedAttributes: Object.keys(allowedAttributes).length
          ? allowedAttributes
          : {}, // sanitize-html expects {} when none
        allowedSchemes: ['http', 'https', 'mailto'],
        allowedSchemesByTag: {},
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: false,
        transformTags: {
          // Drop inline style entirely by default (too easy to abuse)
          '*': (tagName, attribs) => {
            const { style, ...rest } = attribs as Record<string, string>;
            return { tagName, attribs: rest };
          },
        },
      });
    }

    // Browser path: DOM traversal + manual filtering
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');

    const container = document.createElement('div');

    const globalAllowed = new Set((allowedAttributes['*'] ?? []).map(a => a.toLowerCase()));
    const tagToAllowed = new Map<string, Set<string>>(
      Object.entries(allowedAttributes).map(([k, v]) => [k.toLowerCase(), new Set(v.map(x => x.toLowerCase()))])
    );
    const allowedTagSet = new Set(allowedTags.map(t => t.toLowerCase()));

    const appendChildrenUnwrapped = (src: Node, destParent: Node) => {
      for (const child of Array.from(src.childNodes)) {
        const sanitizedChild = sanitizeNode(child);
        if (sanitizedChild) destParent.appendChild(sanitizedChild);
      }
    };

    const isSafeHrefOrSrc = (value: string): boolean => {
      const v = (value ?? '').trim();
      if (v.startsWith('#')) return true; // fragment
      if (v.startsWith('/') || v.startsWith('./') || v.startsWith('../')) return true; // relative
      try {
        const u = new URL(v, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
        return ['http:', 'https:', 'mailto:'].includes(u.protocol);
      } catch {
        return false;
      }
    };

    const sanitizeNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        // Clean text content with sanitizeString rules (light pass).
        const text = this.sanitizeString(node.textContent ?? '');
        return document.createTextNode(text);
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        if (!allowedTagSet.has(tag)) {
          // Strip the element but keep sanitized children (unwrap)
          const frag = document.createDocumentFragment();
          appendChildrenUnwrapped(el, frag);
          return frag;
        }

        const out = document.createElement(tag);

        // Copy only allowed attributes; drop style by default.
        const allowedForTag = new Set([
          ...globalAllowed,
          ...(tagToAllowed.get(tag) ?? new Set<string>()),
        ]);

        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (!allowedForTag.has(name)) continue;
          const val = attr.value;

          if (name === 'href' || name === 'src' || name === 'cite') {
            if (isSafeHrefOrSrc(val)) {
              out.setAttribute(name, val);
            }
            continue;
          }

          if (name === 'style') {
            // Disallow inline style by default (skip).
            continue;
          }

          out.setAttribute(name, val);
        }

        // Recurse
        appendChildrenUnwrapped(el, out);
        return out;
      }

      // Drop comments, processing instructions, etc.
      return null;
    };

    appendChildrenUnwrapped(doc.body, container);
    return container.innerHTML;
  }

  /**
   * Validate an API key format (lightweight).
   * Accepts alnum, dot, underscore, dash; length heuristic.
   */
  validateApiKey(key: string): ValidationResult {
    const errors: string[] = [];
    const value = (key ?? '').trim();

    if (value.length === 0) errors.push('API key cannot be empty');
    if (value.length > 0 && value.length < 20) errors.push('API key appears to be too short');
    if (value.length > 0 && !/^[A-Za-z0-9._-]+$/.test(value)) {
      errors.push('API key contains invalid characters');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * URL sanitizer: allowlist protocols; rejects encoded protocol smuggling.
   * Returns '' for unsafe/invalid URLs.
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    const normalized = url.trim();

    // Quick deny for protocol-looking prefixes (case/encoding variants)
    const lower = normalized.toLowerCase();
    const bad = [
      'javascript:', 'javascript&colon;', 'javascript&#58;', 'javascript&#x3a;', 'javascript&#x003a;',
      'data:', 'data&colon;', 'data&#58;', 'data&#x3a;',
      'vbscript:', 'vbscript&colon;', 'vbscript&#58;', 'vbscript&#x3a;',
      'file:', 'file&colon;', 'about:', 'about&colon;',
    ];
    for (const proto of bad) {
      if (lower.includes(proto)) return '';
    }

    // Decode once to catch encoded protocols
    try {
      const decodedLower = decodeURIComponent(normalized).toLowerCase();
      for (const proto of bad) {
        if (decodedLower.includes(proto)) return '';
      }
    } catch {
      return ''; // malformed encodings
    }

    // Absolute URL path
    try {
      const parsed = new URL(normalized, 'http://example.com'); // base for relative handling
      // If user supplied a protocol, enforce allowlist
      if (parsed.origin !== 'http://example.com') {
        const allowed = ['http:', 'https:', 'mailto:', 'blob:'];
        return allowed.includes(parsed.protocol) ? normalized : '';
      }

      // Relative URL: ensure it doesn't contain dangerous patterns
      if (
        normalized.startsWith('/') ||
        normalized.startsWith('./') ||
        normalized.startsWith('../') ||
        normalized.startsWith('#')
      ) {
        return normalized;
      }

      return '';
    } catch {
      return '';
    }
  }

  /**
   * Harden a filename against traversal/injection; keep simple, portable set.
   */
  sanitizeFilename(filename: string): string {
    let sanitized = filename ?? '';

    // Remove path separators
    sanitized = sanitized.replace(/[/\\]/g, '');

    // Null bytes (path truncation)
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/\x00/g, '');

    // Collapse leading dots (hidden files)
    sanitized = sanitized.replace(/^\.+/, '');

    // Whitelist basic portable charset
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Trim trailing dots/spaces (Windows quirk)
    sanitized = sanitized.replace(/[.\s]+$/g, '');

    // Avoid reserved device names on Windows (case-insensitive), with or without extension.
    const base = sanitized.split('.')[0]?.toUpperCase();
    const reserved = new Set([
      'CON', 'PRN', 'AUX', 'NUL',
      'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
      'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
    ]);
    if (base && reserved.has(base)) {
      sanitized = `_${sanitized}`;
    }

    if (sanitized.length === 0) sanitized = 'file';
    if (sanitized.length > 255) sanitized = sanitized.substring(0, 255);

    return sanitized;
  }
}