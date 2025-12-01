import { Injectable, inject, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants';
// CJS/ESM interop shim for sanitize-html across build configs.
import * as sanitizeHtmlLib from 'sanitize-html';

type SanitizeHtmlOptions = Record<string, unknown>;
type SanitizeHtmlFn = (html: string, options: SanitizeHtmlOptions) => string;
const sanitizeHtmlFn: SanitizeHtmlFn = ((sanitizeHtmlLib as unknown as { default?: SanitizeHtmlFn }).default ??
  sanitizeHtmlLib) as unknown as SanitizeHtmlFn;

/** Single source of truth for base URL in URL parsing across CSR/SSR. */
const DEFAULT_BASE_URL = 'http://localhost';

/** Attributes that are always forbidden in sanitized HTML. */
const FORBIDDEN_ATTRS = ['style', 'srcdoc'] as const;

/**
 * Check if an attribute should be dropped during sanitization.
 * Drops style, srcdoc, and all event handlers (on*).
 */
function shouldDropAttribute(name: string): boolean {
  const lower = name.toLowerCase();
  return FORBIDDEN_ATTRS.includes(lower as (typeof FORBIDDEN_ATTRS)[number]) || lower.startsWith('on');
}

/**
 * Check if a URL value is safe for href/src/cite attributes.
 */
function isSafeUrlValue(value: string): boolean {
  const v = (value ?? '').trim();
  if (v.startsWith('//')) return false; // protocol-relative
  if (v.startsWith('#')) return true; // fragment-only
  if (v.startsWith('/') || v.startsWith('./') || v.startsWith('../')) return true; // relative

  try {
    const u = new URL(v, DEFAULT_BASE_URL);
    return (VALIDATION_RULES.ALLOWED_PROTOCOLS as readonly string[]).includes(u.protocol);
  } catch {
    return false;
  }
}

/**
 * Normalize allowed attributes by filtering out forbidden ones.
 */
function normalizeAllowedAttributes(allowedAttributes: Record<string, string[]>): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};
  for (const [tag, attrs] of Object.entries(allowedAttributes)) {
    normalized[tag.toLowerCase()] = (attrs || []).filter((a) => !shouldDropAttribute(a)).map((a) => a.toLowerCase());
  }
  if (normalized['*']) {
    normalized['*'] = normalized['*'].filter((a) => !shouldDropAttribute(a));
  }
  return normalized;
}

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

    if (value.length === 0) errors.push(ERROR_MESSAGES.PROMPT_EMPTY);
    if (value.length > VALIDATION_RULES.MAX_PROMPT_LENGTH) errors.push(ERROR_MESSAGES.PROMPT_TOO_LONG);

    if (value.length > 0) {
      const specials = (value.match(/[^a-zA-Z0-9\s,.!?-]/g) || []).length;
      const ratio = specials / value.length;
      if (ratio > VALIDATION_RULES.MAX_SPECIAL_CHAR_RATIO) errors.push(ERROR_MESSAGES.PROMPT_SPECIAL_CHARS);
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
    s = s.replace(/[\x00-\x1F\x7F-\x9F]/g, ''); // C0/C1 + nulls
    s = s.replace(/[\u200B-\u200F\uFEFF]/g, ''); // ZWSP/ZWJ/ZWNJ/LRM/RLM/BOM
    s = s.replace(/[\u202A-\u202E\u2060-\u2069]/g, ''); // bidi overrides/isolates
    s = s.replace(/[\u2028\u2029]/g, ''); // line/para sep
    s = s.trim().replace(/\s+/g, ' '); // collapse whitespace
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
      allowedSchemes: [...VALIDATION_RULES.ALLOWED_SCHEMES],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
      allowProtocolRelative: false,
    });

    // Event handler patterns (defensive; moot when no tags remain)
    out = this.replaceRepeatedly(out, /\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    out = this.replaceRepeatedly(out, /\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // Dangerous protocol strings (encoded/whitespace-tolerant for literal ':' variants)
    for (const proto of VALIDATION_RULES.DANGEROUS_PROTOCOLS) {
      const pattern = proto.includes(':') ? proto.replace(':', '\\s*:\\s*') : proto;
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

    const normalizedAllowedAttrs = normalizeAllowedAttributes(allowedAttributes);

    if (!this.hasDomSupport()) {
      return this.sanitizeWithLibrary(raw, allowedTags, normalizedAllowedAttrs);
    }

    return this.sanitizeWithDom(raw, allowedTags, normalizedAllowedAttrs);
  }

  /** Check if DOM APIs are available (browser vs SSR). */
  private hasDomSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as { DOMParser?: unknown }).DOMParser !== 'undefined' &&
      typeof document !== 'undefined'
    );
  }

  /** Sanitize HTML using the sanitize-html library (SSR path). */
  private sanitizeWithLibrary(
    raw: string,
    allowedTags: string[],
    normalizedAllowedAttrs: Record<string, string[]>
  ): string {
    return sanitizeHtmlFn(raw, {
      allowedTags,
      allowedAttributes: normalizedAllowedAttrs,
      allowedSchemes: [...VALIDATION_RULES.ALLOWED_SCHEMES],
      allowedSchemesByTag: {},
      allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
      allowProtocolRelative: false,
      transformTags: {
        '*': (tagName: string, attribs: Record<string, string>) => {
          const { style: _style, srcdoc: _srcdoc, ...rest } = attribs || {};
          for (const k of Object.keys(rest)) {
            if (k.toLowerCase().startsWith('on')) {
              const restMutable = rest as Record<string, string>;
              delete restMutable[k];
            }
          }
          return { tagName, attribs: rest };
        },
      },
    });
  }

  /** Sanitize HTML using DOM APIs (browser path). */
  private sanitizeWithDom(
    raw: string,
    allowedTags: string[],
    normalizedAllowedAttrs: Record<string, string[]>
  ): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, 'text/html');
    const outContainer = document.createElement('div');

    const context = this.createSanitizationContext(allowedTags, normalizedAllowedAttrs);
    this.appendChildrenSanitized(doc.body, outContainer, context);

    return outContainer.innerHTML;
  }

  /** Create context object for DOM sanitization. */
  private createSanitizationContext(
    allowedTags: string[],
    normalizedAllowedAttrs: Record<string, string[]>
  ): {
    allowedTagSet: Set<string>;
    globalAllowed: Set<string>;
    perTagAllowed: Map<string, Set<string>>;
  } {
    const allowedTagSet = new Set(allowedTags.map((t) => t.toLowerCase()));
    const globalAllowed = new Set((normalizedAllowedAttrs['*'] ?? []).map((a) => a.toLowerCase()));
    const perTagAllowed = new Map<string, Set<string>>(
      Object.entries(normalizedAllowedAttrs)
        .filter(([k]) => k !== '*')
        .map(([k, v]) => [k.toLowerCase(), new Set(v.map((x) => x.toLowerCase()))])
    );

    return { allowedTagSet, globalAllowed, perTagAllowed };
  }

  /** Recursively sanitize and append child nodes. */
  private appendChildrenSanitized(
    src: Node,
    dest: Node,
    context: {
      allowedTagSet: Set<string>;
      globalAllowed: Set<string>;
      perTagAllowed: Map<string, Set<string>>;
    }
  ): void {
    for (const child of Array.from(src.childNodes)) {
      const sanitized = this.sanitizeNodeDom(child, context);
      if (sanitized) dest.appendChild(sanitized);
    }
  }

  /** Sanitize a single DOM node. */
  private sanitizeNodeDom(
    node: Node,
    context: {
      allowedTagSet: Set<string>;
      globalAllowed: Set<string>;
      perTagAllowed: Map<string, Set<string>>;
    }
  ): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = this.sanitizeString(node.textContent ?? '');
      return document.createTextNode(text);
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      return this.sanitizeElementNode(node as Element, context);
    }

    return null; // drop comments/others
  }

  /** Sanitize an element node. */
  private sanitizeElementNode(
    el: Element,
    context: {
      allowedTagSet: Set<string>;
      globalAllowed: Set<string>;
      perTagAllowed: Map<string, Set<string>>;
    }
  ): Node {
    const tag = el.tagName.toLowerCase();

    if (!context.allowedTagSet.has(tag)) {
      const frag = document.createDocumentFragment();
      this.appendChildrenSanitized(el, frag, context);
      return frag;
    }

    const outEl = document.createElement(tag);
    const allowed = new Set([...context.globalAllowed, ...(context.perTagAllowed.get(tag) ?? new Set<string>())]);

    this.copyAllowedAttributes(el, outEl, allowed);
    this.appendChildrenSanitized(el, outEl, context);

    return outEl;
  }

  /** Copy allowed attributes from source to destination element. */
  private copyAllowedAttributes(src: Element, dest: Element, allowed: Set<string>): void {
    for (const attr of Array.from(src.attributes)) {
      const name = attr.name.toLowerCase();
      if (shouldDropAttribute(name)) continue;
      if (!allowed.has(name)) continue;

      const val = attr.value;
      if (name === 'href' || name === 'src' || name === 'cite') {
        if (isSafeUrlValue(val)) {
          dest.setAttribute(name, val);
        }
        continue;
      }
      dest.setAttribute(name, val);
    }
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
    for (const proto of VALIDATION_RULES.DANGEROUS_PROTOCOLS) {
      if (lower.includes(proto)) return '';
    }

    // Decode once: refuse if decoding introduces control chars or bad schemes.
    try {
      const decoded = decodeURIComponent(normalized);
      // eslint-disable-next-line no-control-regex
      if (/[\x00-\x1F\x7F]/.test(decoded)) return '';
      const decLower = decoded.toLowerCase();
      for (const proto of VALIDATION_RULES.DANGEROUS_PROTOCOLS) {
        if (decLower.includes(proto)) return '';
      }
    } catch {
      return ''; // malformed encoding
    }

    // Absolute vs relative
    try {
      const parsed = new URL(normalized, DEFAULT_BASE_URL); // unified base for relative parsing
      const isAbsolute = parsed.origin !== new URL(DEFAULT_BASE_URL).origin;

      if (isAbsolute) {
        return (VALIDATION_RULES.ALLOWED_PROTOCOLS as readonly string[]).includes(parsed.protocol) ? normalized : '';
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

    s = s.replace(/[/\\]/g, ''); // separators
    // eslint-disable-next-line no-control-regex
    s = s.replace(/\x00/g, ''); // nulls
    s = s.replace(/^\.+/, ''); // leading dots (hidden)
    s = s.replace(/[^a-zA-Z0-9._-]/g, '_'); // portable charset
    s = s.replace(/[.\s]+$/g, ''); // trailing dots/spaces (Windows)
    // Use timestamp to ensure uniqueness and prevent collisions
    if (s.length === 0) s = `file_${Date.now()}`;

    // Avoid Windows reserved device names (case-insensitive)
    const base = s.split('.')[0]?.toUpperCase();
    const reserved = new Set([
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ]);
    if (base && reserved.has(base)) s = `_${s}`;

    if (s.length > 255) s = s.slice(0, 255);
    return s;
  }
}
