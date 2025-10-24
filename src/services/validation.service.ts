/**
 * Validation & Sanitization Service (Angular)
 * - Defense-in-depth against XSS, protocol smuggling, Unicode obfuscation
 * - SSR-safe (no DOM usage on server path); deterministic & testable
 * - Strict URL, filename, and input validators
 */

import { Injectable, inject } from '@angular/core';
import { DomSanitizer, SecurityContext } from '@angular/platform-browser';
// CJS/ESM interop shim for sanitize-html across build configs.
import * as sanitizeHtmlLib from 'sanitize-html';

type SanitizeHtmlFn = (html: string, options: any) => string;
// @ts-expect-error – runtime interop between CJS/ESM
const sanitizeHtmlFn: SanitizeHtmlFn = (sanitizeHtmlLib as any).default ?? (sanitizeHtmlLib as any);

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class ValidationService {
  private readonly domSanitizer = inject(DomSanitizer);

  /** Replace matches repeatedly until input stabilizes (fixed point). */
  private replaceRepeatedly(input: string, regex: RegExp, replacement: string): string {
    let prev: string;
    do {
      prev = input;
      input = input.replace(regex, replacement);
    } while (input !== prev);
    return input;
  }

  /** Validate a free-form prompt. */
  validatePrompt(prompt: string): ValidationResult {
    const errors: string[] = [];
    const value = (prompt ?? '').trim();

    if (value.length === 0) errors.push('Prompt cannot be empty');
    if (value.length > 2000) errors.push('Prompt is too long (maximum 2000 characters)');

    if (value.length > 0) {
      const specials = (value.match(/[^a-zA-Z0-9\s,.!?-]/g) || []).length;
      const ratio = specials / value.length;
      if (ratio > 0.3) errors.push('Prompt contains too many special characters');
    }
    return { isValid: errors.length === 0, errors };
  }

  /** Validate an image URL (http/https/blob) structurally. */
  validateImageUrl(url: string): ValidationResult {
    const errors: string[] = [];
    const value = (url ?? '').trim();

    if (value.length === 0) {
      errors.push('URL cannot be empty');
      return { isValid: false, errors };
    }
    if (value.startsWith('//')) {
      errors.push('Protocol-relative URLs are not allowed');
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

  /** Validate optional integer seed. */
  validateSeed(seed: number | undefined): ValidationResult {
    const errors: string[] = [];
    if (seed !== undefined) {
      if (!Number.isInteger(seed)) errors.push('Seed must be an integer');
      if (typeof seed === 'number' && seed < 0) errors.push('Seed must be a positive number');
      if (typeof seed === 'number' && seed > Number.MAX_SAFE_INTEGER) errors.push('Seed is too large');
    }
    return { isValid: errors.length === 0, errors };
  }

  /** Validate image dimensions within safe bounds. */
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

  /** Lightweight API key validator (format heuristic). */
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
   * Unicode hygiene & control character stripping.
   * NFC normalization + removal of control/zero-width/bidi/invisible chars.
   */
  sanitizeString(input: string): string {
    let s = (input ?? '').normalize('NFC');
    // eslint-disable-next-line no-control-regex
    s = s.replace(/[\x00-\x1F\x7F-\x9F]/g, '');                    // C0/C1 + nulls
    s = s.replace(/[\u200B-\u200F\uFEFF]/g, '');                   // ZWSP/ZWJ/ZWNJ/LRM/RLM/BOM
    s = s.replace(/[\u202A-\u202E\u2060-\u2069]/g, '');            // bidi overrides/isolates
    s = s.replace(/[\u2028\u2029]/g, '');                          // line/para sep
    s = s.trim().replace(/\s+/g, ' ');                             // collapse whitespace
    return s;
  }

  /**
   * Strict HTML → plain text sanitizer.
   * 1) sanitize-html strips all tags/attrs
   * 2) scrub residual protocol strings / url() patterns
   */
  sanitizeHtml(html: string): string {
    const raw = (html ?? '').trim();
    if (!raw) return '';

    let out = sanitizeHtmlFn(raw, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
      allowedSchemes: ['http', 'https', 'mailto', 'blob'],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
      allowProtocolRelative: false,
    });

    // Event handler patterns (defensive; moot when no tags remain)
    out = this.replaceRepeatedly(out, /\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    out = this.replaceRepeatedly(out, /\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // Dangerous protocol strings (encoded/whitespace-tolerant)
    for (const proto of [
      'javascript:', 'javascript&colon;', 'javascript&#58;', 'javascript&#x3a;', 'javascript&#x003a;',
      'data:', 'data&colon;', 'data&#58;', 'data&#x3a;',
      'vbscript:', 'vbscript&colon;', 'vbscript&#58;', 'vbscript&#x3a;',
      'file:', 'about:'
    ]) {
      const pattern = proto.replace(':', '\\s*:\\s*');
      out = this.replaceRepeatedly(out, new RegExp(pattern, 'gi'), '');
    }

    // CSS url() with bad schemes (if any residual text contains it)
    out = out.replace(/url\s*\(\s*['"]?\s*(?:javascript:|data:|vbscript:)[^)]*['"]?\s*\)/gi, '');
    return out;
  }

  /** Use for [innerHTML]; still passes Angular’s security checks. */
  sanitizeHtmlForAngular(html: string): string {
    const textOnly = this.sanitizeHtml(html);
    return this.domSanitizer.sanitize(SecurityContext.HTML, textOnly) ?? '';
  }

  /**
   * Whitelist sanitizer that preserves select markup.
   * Browser: DOMParser traversal; SSR: sanitize-html fallback with an equivalent allowlist.
   * Never allows inline event handlers (on*), inline style, or srcdoc.
   */
  sanitizeHtmlAdvanced(
    html: string,
    allowedTags: string[] = [],
    allowedAttributes: Record<string, string[]> = {}
  ): string {
    const raw = (html ?? '').trim();
    if (!raw) return '';
    if (allowedTags.length === 0) return this.sanitizeHtml(raw);

    // Normalize allowlist: drop style/srcdoc/on* regardless of caller config.
    const normalizedAllowedAttrs: Record<string, string[]> = {};
    const dropAttr = (name: string) =>
      name.toLowerCase() === 'style' || name.toLowerCase() === 'srcdoc' || name.toLowerCase().startsWith('on');

    for (const [tag, attrs] of Object.entries(allowedAttributes)) {
      normalizedAllowedAttrs[tag.toLowerCase()] = (attrs || [])
        .filter(a => !dropAttr(a))
        .map(a => a.toLowerCase());
    }
    if (normalizedAllowedAttrs['*']) {
      normalizedAllowedAttrs['*'] = normalizedAllowedAttrs['*'].filter(a => !dropAttr(a));
    }

    const hasDom =
      typeof window !== 'undefined' &&
      typeof (window as any).DOMParser !== 'undefined' &&
      typeof document !== 'undefined';

    if (!hasDom) {
      // SSR-safe fallback using sanitize-html with equivalent allowlist.
      return sanitizeHtmlFn(raw, {
        allowedTags,
        allowedAttributes: normalizedAllowedAttrs,
        allowedSchemes: ['http', 'https', 'mailto', 'blob'],
        allowedSchemesByTag: {},
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: false,
        transformTags: {
          '*': (tagName: string, attribs: Record<string, string>) => {
            const { style, srcdoc, ...rest } = attribs || {};
            for (const k of Object.keys(rest)) {
              if (k.toLowerCase().startsWith('on')) delete (rest as any)[k];
            }
            return { tagName, attribs: rest };
          },
        },
      });
    }

    // Browser path: DOM traversal & selective attribute copy.
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');

    const outContainer = document.createElement('div');
    const allowedTagSet = new Set(allowedTags.map(t => t.toLowerCase()));
    const globalAllowed = new Set((normalizedAllowedAttrs['*'] ?? []).map(a => a.toLowerCase()));
    const perTagAllowed = new Map<string, Set<string>>(
      Object.entries(normalizedAllowedAttrs)
        .filter(([k]) => k !== '*')
        .map(([k, v]) => [k.toLowerCase(), new Set(v.map(x => x.toLowerCase()))])
    );

    const isSafeHrefOrSrc = (value: string): boolean => {
      const v = (value ?? '').trim();
      if (v.startsWith('//')) return false;                       // protocol-relative
      if (v.startsWith('#')) return true;                         // fragment-only
      if (v.startsWith('/') || v.startsWith('./') || v.startsWith('../')) return true; // relative
      try {
        const u = new URL(v, window.location.origin);
        return ['http:', 'https:', 'mailto:', 'blob:'].includes(u.protocol);
      } catch {
        return false;
      }
    };

    const appendChildrenUnwrapped = (src: Node, dest: Node) => {
      for (const child of Array.from(src.childNodes)) {
        const n = sanitizeNode(child);
        if (n) dest.appendChild(n);
      }
    };

    const sanitizeNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = this.sanitizeString(node.textContent ?? '');
        return document.createTextNode(text);
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        const tag = el.tagName.toLowerCase();

        if (!allowedTagSet.has(tag)) {
          const frag = document.createDocumentFragment();
          appendChildrenUnwrapped(el, frag);
          return frag;
        }

        const outEl = document.createElement(tag);
        const allowed = new Set([
          ...globalAllowed,
          ...(perTagAllowed.get(tag) ?? new Set<string>()),
        ]);

        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          if (name === 'style' || name === 'srcdoc' || name.startsWith('on')) continue; // hard bans
          if (!allowed.has(name)) continue;

          const val = attr.value;
          if (name === 'href' || name === 'src' || name === 'cite') {
            if (isSafeHrefOrSrc(val)) {
              outEl.setAttribute(name, val);
            }
            continue;
          }
          outEl.setAttribute(name, val);
        }

        appendChildrenUnwrapped(el, outEl);
        return outEl;
      }
      return null; // drop comments/others
    };

    appendChildrenUnwrapped(doc.body, outContainer);
    return outContainer.innerHTML;
  }

  /**
   * URL sanitizer: allowlist protocols; reject smuggling, control chars, and protocol-relative.
   * Returns '' for unsafe/invalid URLs.
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    const normalized = url.trim();
    const lower = normalized.toLowerCase();

    if (lower.startsWith('//')) return ''; // protocol-relative denied

    // Fast deny for obvious bad schemes (including HTML entity encodings)
    const bad = [
      'javascript:', 'javascript&colon;', 'javascript&#58;', 'javascript&#x3a;', 'javascript&#x003a;',
      'data:', 'data&colon;', 'data&#58;', 'data&#x3a;',
      'vbscript:', 'vbscript&colon;', 'vbscript&#58;', 'vbscript&#x3a;',
      'file:', 'file&colon;', 'about:', 'about&colon;',
    ];
    for (const proto of bad) if (lower.includes(proto)) return '';

    // Decode once: refuse if decoding introduces control chars or bad schemes.
    try {
      const decoded = decodeURIComponent(normalized);
      // eslint-disable-next-line no-control-regex
      if (/[\x00-\x1F\x7F]/.test(decoded)) return '';
      const decLower = decoded.toLowerCase();
      for (const proto of bad) if (decLower.includes(proto)) return '';
    } catch {
      return ''; // malformed encoding
    }

    // Absolute vs relative
    try {
      const parsed = new URL(normalized, 'http://example.com'); // base for relative
      const isAbsolute = parsed.origin !== 'http://example.com';

      if (isAbsolute) {
        return ['http:', 'https:', 'mailto:', 'blob:'].includes(parsed.protocol) ? normalized : '';
      }

      // Relative: permit rooted/relative paths and fragments only
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

  /** Filename hardening across platforms. */
  sanitizeFilename(filename: string): string {
    let s = filename ?? '';

    s = s.replace(/[/\\]/g, '');                 // separators
    // eslint-disable-next-line no-control-regex
    s = s.replace(/\x00/g, '');                  // nulls
    s = s.replace(/^\.+/, '');                   // leading dots (hidden)
    s = s.replace(/[^a-zA-Z0-9._-]/g, '_');      // portable charset
    s = s.replace(/[.\s]+$/g, '');               // trailing dots/spaces (Windows)
    if (s.length === 0) s = 'file';

    // Avoid Windows reserved device names (case-insensitive)
    const base = s.split('.')[0]?.toUpperCase();
    const reserved = new Set([
      'CON','PRN','AUX','NUL',
      'COM1','COM2','COM3','COM4','COM5','COM6','COM7','COM8','COM9',
      'LPT1','LPT2','LPT3','LPT4','LPT5','LPT6','LPT7','LPT8','LPT9',
    ]);
    if (base && reserved.has(base)) s = `_${s}`;

    if (s.length > 255) s = s.slice(0, 255);
    return s;
  }
}
