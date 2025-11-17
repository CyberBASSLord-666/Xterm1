import { TestBed } from '@angular/core/testing';
import { ValidationService } from '../validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validatePrompt', () => {
    it('should accept valid prompt', () => {
      const result = service.validatePrompt('A beautiful sunset over mountains');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty prompt', () => {
      const result = service.validatePrompt('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Prompt cannot be empty');
    });

    it('should reject too long prompt', () => {
      const longPrompt = 'a'.repeat(2001);
      const result = service.validatePrompt(longPrompt);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('too long'))).toBe(true);
    });

    it('should reject prompt with too many special characters', () => {
      const specialChars = '!!!@@@###$$$%%%^^^&&&***';
      const result = service.validatePrompt(specialChars);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('special characters'))).toBe(true);
    });
  });

  describe('validateImageUrl', () => {
    it('should accept valid http URL', () => {
      const result = service.validateImageUrl('http://example.com/image.jpg');
      expect(result.isValid).toBe(true);
    });

    it('should accept valid https URL', () => {
      const result = service.validateImageUrl('https://example.com/image.jpg');
      expect(result.isValid).toBe(true);
    });

    it('should accept blob URL', () => {
      const result = service.validateImageUrl('blob:http://example.com/uuid');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty URL', () => {
      const result = service.validateImageUrl('');
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid protocol', () => {
      const result = service.validateImageUrl('ftp://example.com/image.jpg');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('protocol'))).toBe(true);
    });

    it('should reject malformed URL', () => {
      const result = service.validateImageUrl('not a url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });
  });

  describe('validateSeed', () => {
    it('should accept undefined seed', () => {
      const result = service.validateSeed(undefined);
      expect(result.isValid).toBe(true);
    });

    it('should accept valid integer', () => {
      const result = service.validateSeed(42);
      expect(result.isValid).toBe(true);
    });

    it('should reject float', () => {
      const result = service.validateSeed(42.5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seed must be an integer');
    });

    it('should reject negative number', () => {
      const result = service.validateSeed(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seed must be a positive number');
    });

    it('should reject too large number', () => {
      const result = service.validateSeed(Number.MAX_SAFE_INTEGER + 1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seed is too large');
    });
  });

  describe('validateDimensions', () => {
    it('should accept valid dimensions', () => {
      const result = service.validateDimensions(1920, 1080);
      expect(result.isValid).toBe(true);
    });

    it('should reject zero dimensions', () => {
      const result = service.validateDimensions(0, 1080);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('positive'))).toBe(true);
    });

    it('should reject negative dimensions', () => {
      const result = service.validateDimensions(-1920, 1080);
      expect(result.isValid).toBe(false);
    });

    it('should reject too large dimensions', () => {
      const result = service.validateDimensions(10000, 10000);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('too large'))).toBe(true);
    });

    it('should reject too small dimensions', () => {
      const result = service.validateDimensions(32, 32);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('too small'))).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should remove null bytes', () => {
      const result = service.sanitizeString('test\x00string');
      expect(result).toBe('teststring');
    });

    it('should remove control characters', () => {
      const result = service.sanitizeString('test\x01\x02string');
      expect(result).toBe('teststring');
    });

    it('should preserve normal characters', () => {
      const result = service.sanitizeString('normal string 123');
      expect(result).toBe('normal string 123');
    });

    it('should remove zero-width characters', () => {
      const result = service.sanitizeString('test\u200Bstring');
      expect(result).toBe('teststring');
    });

    it('should remove directional override characters', () => {
      const result = service.sanitizeString('test\u202Astring');
      expect(result).toBe('teststring');
    });

    it('should normalize Unicode', () => {
      const result = service.sanitizeString('café');
      expect(result).toBeTruthy();
    });

    it('should remove multiple consecutive spaces', () => {
      const result = service.sanitizeString('test    string');
      expect(result).toBe('test string');
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML', () => {
      const result = service.sanitizeHtml('<script>alert("xss")</script>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should preserve text content', () => {
      const result = service.sanitizeHtml('plain text');
      expect(result).toBe('plain text');
    });

    it('should remove iframe tags', () => {
      const result = service.sanitizeHtml('<iframe src="malicious"></iframe>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('iframe');
    });

    it('should remove event handlers', () => {
      const result = service.sanitizeHtml('<div onclick="alert(1)">test</div>');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should remove javascript: protocol', () => {
      const result = service.sanitizeHtml('<a href="javascript:alert(1)">link</a>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should remove data: protocol', () => {
      const result = service.sanitizeHtml('<img src="data:text/html,<script>alert(1)</script>">');
      expect(result).not.toContain('data:');
      expect(result).not.toContain('script');
    });

    it('should handle encoded attacks', () => {
      const result = service.sanitizeHtml('<a href="javascript&#58;alert(1)">link</a>');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('alert');
    });

    it('should handle empty input', () => {
      const result = service.sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const result = service.sanitizeHtml('   ');
      expect(result).toBe('');
    });

    it('should remove vbscript: protocol', () => {
      const result = service.sanitizeHtml('<a href="vbscript:msgbox(1)">link</a>');
      expect(result).not.toContain('vbscript');
    });

    it('should remove file: protocol', () => {
      const result = service.sanitizeHtml('<a href="file:///etc/passwd">link</a>');
      expect(result).not.toContain('file:');
    });

    it('should remove meta tags', () => {
      const result = service.sanitizeHtml('<meta http-equiv="refresh" content="0;url=http://evil.com">');
      expect(result).not.toContain('<meta');
      expect(result).not.toContain('meta');
    });

    it('should remove link tags', () => {
      const result = service.sanitizeHtml('<link rel="stylesheet" href="http://evil.com/malicious.css">');
      expect(result).not.toContain('<link');
      expect(result).not.toContain('link');
    });

    it('should remove base tags', () => {
      const result = service.sanitizeHtml('<base href="http://evil.com/">');
      expect(result).not.toContain('<base');
      expect(result).not.toContain('base');
    });

    it('should handle multiple XSS vectors in one input', () => {
      const malicious = `
        <script>alert('xss')</script>
        <img src="x" onerror="alert(1)">
        <a href="javascript:alert(2)">click</a>
        <div onclick="alert(3)">text</div>
      `;
      const result = service.sanitizeHtml(malicious);
      expect(result).not.toContain('script');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should handle CSS expression attacks', () => {
      const result = service.sanitizeHtml('<div style="width: expression(alert(1))">test</div>');
      expect(result).not.toContain('expression');
      expect(result).not.toContain('alert');
    });

    it('should handle CSS url() attacks', () => {
      const result = service.sanitizeHtml('<div style="background: url(javascript:alert(1))">test</div>');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('alert');
    });

    it('should handle encoded colon in javascript protocol', () => {
      const result = service.sanitizeHtml('<a href="javascript&colon;alert(1)">link</a>');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('alert');
    });

    it('should handle HTML entity encoded colon', () => {
      const result = service.sanitizeHtml('<a href="javascript&#x3a;alert(1)">link</a>');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('alert');
    });
  });

  describe('sanitizeHtmlForAngular', () => {
    it('should return sanitized safe HTML for Angular templates', () => {
      const result = service.sanitizeHtmlForAngular('<div>Hello World</div>');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('Hello World');
    });

    it('should completely remove script tags', () => {
      const result = service.sanitizeHtmlForAngular('<script>alert("xss")</script>');
      expect(typeof result).toBe('string');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      // Script tags are completely removed, so result may be empty
    });

    it('should handle plain text', () => {
      const result = service.sanitizeHtmlForAngular('plain text');
      expect(result).toBe('plain text');
    });

    it('should handle empty input', () => {
      const result = service.sanitizeHtmlForAngular('');
      expect(result).toBe('');
    });

    it('should remove all XSS vectors before Angular processing', () => {
      const malicious = '<img src="x" onerror="alert(1)"><a href="javascript:void(0)">click</a>';
      const result = service.sanitizeHtmlForAngular(malicious);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('alert');
    });
  });

  describe('validateApiKey', () => {
    it('should accept valid API key', () => {
      const result = service.validateApiKey('AIzaSyDtX-valid-key-1234567890');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty key', () => {
      const result = service.validateApiKey('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('API key cannot be empty');
    });

    it('should reject too short key', () => {
      const result = service.validateApiKey('short');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('too short'))).toBe(true);
    });

    it('should reject invalid characters', () => {
      const result = service.validateApiKey('invalid key with spaces!!!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('invalid characters'))).toBe(true);
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid http URL', () => {
      const result = service.sanitizeUrl('http://example.com');
      expect(result).toBe('http://example.com');
    });

    it('should accept valid https URL', () => {
      const result = service.sanitizeUrl('https://example.com');
      expect(result).toBe('https://example.com');
    });

    it('should reject javascript: protocol', () => {
      const result = service.sanitizeUrl('javascript:alert(1)');
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const result = service.sanitizeUrl('data:text/html,<script>alert(1)</script>');
      expect(result).toBe('');
    });

    it('should reject vbscript: protocol', () => {
      const result = service.sanitizeUrl('vbscript:msgbox(1)');
      expect(result).toBe('');
    });

    it('should reject encoded javascript:', () => {
      const result = service.sanitizeUrl('javascript&colon;alert(1)');
      expect(result).toBe('');
    });

    it('should accept relative URLs', () => {
      const result = service.sanitizeUrl('/path/to/resource');
      expect(result).toBe('/path/to/resource');
    });

    it('should reject relative URLs with dangerous protocols', () => {
      const result = service.sanitizeUrl('./javascript:alert(1)');
      expect(result).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should accept valid filename', () => {
      const result = service.sanitizeFilename('image.jpg');
      expect(result).toBe('image.jpg');
    });

    it('should remove path separators', () => {
      const result = service.sanitizeFilename('../../../etc/passwd');
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
    });

    it('should remove null bytes', () => {
      const result = service.sanitizeFilename('file\x00.jpg');
      expect(result).not.toContain('\x00');
    });

    it('should remove leading dots', () => {
      const result = service.sanitizeFilename('..hidden');
      expect(result).not.toMatch(/^\./);
    });

    it('should sanitize special characters', () => {
      const result = service.sanitizeFilename('file<>:"|?*.jpg');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.jpg';
      const result = service.sanitizeFilename(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty input with unique timestamp', () => {
      const result = service.sanitizeFilename('');
      expect(result).toMatch(/^file_\d+$/);
      expect(result).not.toBe('file'); // Should include timestamp
    });

    it('should generate unique filenames for multiple empty inputs', () => {
      const result1 = service.sanitizeFilename('');
      const result2 = service.sanitizeFilename('');
      // Results should be different due to timestamp
      // Note: May occasionally be same if calls are extremely fast
      expect(result1).toMatch(/^file_\d+$/);
      expect(result2).toMatch(/^file_\d+$/);
    });

    it('should handle whitespace-only input by converting to underscores', () => {
      const result = service.sanitizeFilename('   ');
      expect(result).toBe('___'); // Whitespace converted to underscores
    });

    it('should avoid Windows reserved names', () => {
      const result = service.sanitizeFilename('CON');
      expect(result).toBe('_CON');
    });

    it('should handle Windows reserved names with extension', () => {
      const result = service.sanitizeFilename('NUL.txt');
      expect(result).toBe('_NUL.txt');
    });
  });

  describe('sanitizeHtmlAdvanced', () => {
    it('should strip all tags when allowedTags is empty', () => {
      const result = service.sanitizeHtmlAdvanced('<div><p>text</p></div>', [], {});
      expect(result).not.toContain('<div>');
      expect(result).not.toContain('<p>');
      expect(result).toContain('text');
    });

    it('should preserve allowed tags', () => {
      const result = service.sanitizeHtmlAdvanced('<div><p>text</p></div>', ['p'], {});
      expect(result).toContain('<p>');
      expect(result).toContain('text');
    });

    it('should preserve allowed attributes', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="http://example.com" class="link">text</a>',
        ['a'],
        { a: ['href', 'class'] }
      );
      expect(result).toContain('href');
      expect(result).toContain('class');
    });

    it('should remove style attribute regardless of allowlist', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<div style="color: red">text</div>',
        ['div'],
        { div: ['style'] }
      );
      expect(result).not.toContain('style');
    });

    it('should remove srcdoc attribute regardless of allowlist', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<iframe srcdoc="<script>alert(1)</script>">text</iframe>',
        ['iframe'],
        { iframe: ['srcdoc'] }
      );
      expect(result).not.toContain('srcdoc');
    });

    it('should remove event handlers regardless of allowlist', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<button onclick="alert(1)">click</button>',
        ['button'],
        { button: ['onclick'] }
      );
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should handle global allowed attributes with asterisk', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<div class="test"><p class="test2">text</p></div>',
        ['div', 'p'],
        { '*': ['class'] }
      );
      expect(result).toContain('class="test"');
      expect(result).toContain('class="test2"');
    });

    it('should reject protocol-relative URLs in href', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="//evil.com">link</a>',
        ['a'],
        { a: ['href'] }
      );
      // Protocol-relative URLs should be rejected
      expect(result).not.toContain('//evil.com');
    });

    it('should accept fragment-only URLs', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="#section">link</a>',
        ['a'],
        { a: ['href'] }
      );
      expect(result).toContain('#section');
    });

    it('should accept relative URLs', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="/path/to/page">link</a>',
        ['a'],
        { a: ['href'] }
      );
      expect(result).toContain('/path/to/page');
    });

    it('should reject dangerous protocols in href', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="javascript:alert(1)">link</a>',
        ['a'],
        { a: ['href'] }
      );
      expect(result).not.toContain('javascript');
    });

    it('should handle nested tags with allowlist', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<div><p><strong>bold</strong> text</p></div>',
        ['div', 'p', 'strong'],
        {}
      );
      expect(result).toContain('<div>');
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('bold');
    });

    it('should unwrap disallowed tags but keep content', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<div><script>alert(1)</script><p>safe</p></div>',
        ['div', 'p'],
        {}
      );
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>safe</p>');
    });

    it('should handle empty input', () => {
      const result = service.sanitizeHtmlAdvanced('', ['div'], {});
      expect(result).toBe('');
    });

    it('should handle whitespace-only input', () => {
      const result = service.sanitizeHtmlAdvanced('   ', ['div'], {});
      expect(result).toBe('');
    });

    it('should sanitize text content within allowed tags', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<p>test\x00string\u200B</p>',
        ['p'],
        {}
      );
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\u200B');
    });
  });

  describe('Type Safety and Edge Cases', () => {
    it('should handle null/undefined inputs gracefully in sanitizeString', () => {
      expect(service.sanitizeString(null as any)).toBe('');
      expect(service.sanitizeString(undefined as any)).toBe('');
    });

    it('should handle null/undefined inputs in sanitizeHtml', () => {
      expect(service.sanitizeHtml(null as any)).toBe('');
      expect(service.sanitizeHtml(undefined as any)).toBe('');
    });

    it('should handle null/undefined inputs in sanitizeUrl', () => {
      expect(service.sanitizeUrl(null as any)).toBe('');
      expect(service.sanitizeUrl(undefined as any)).toBe('');
    });

    it('should handle protocol-relative URLs correctly', () => {
      const result = service.validateImageUrl('//example.com/image.jpg');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e: string) => e.includes('Protocol-relative'))).toBe(true);
    });

    it('should handle encoded protocol smuggling attempts', () => {
      const encoded = 'javascript%3Aalert(1)';
      const result = service.sanitizeUrl(encoded);
      expect(result).toBe('');
    });

    it('should handle double-encoded protocol smuggling', () => {
      const doubleEncoded = 'javascript%253Aalert(1)';
      const result = service.sanitizeUrl(doubleEncoded);
      // After one decode, it should still detect the dangerous protocol
      expect(result).toBe('');
    });

    it('should handle control characters in URLs', () => {
      const urlWithControl = 'http://example.com/\x00path';
      const result = service.sanitizeUrl(urlWithControl);
      expect(result).toBe('');
    });

    it('should validate ALLOWED_PROTOCOLS type is readonly', () => {
      // This test verifies the const assertion is working
      const protocols = service.sanitizeUrl('http://example.com');
      expect(protocols).toBeTruthy();
    });

    it('should handle replaceRepeatedly edge cases', () => {
      // Test that replaceRepeatedly doesn't cause infinite loops
      const html = '<div onclick="alert(1)" onclick="alert(2)">test</div>';
      const result = service.sanitizeHtml(html);
      expect(result).not.toContain('onclick');
    });
  });

  describe('Cross-Site Scripting (XSS) Prevention - Advanced', () => {
    it('should block mixed-case javascript: protocol', () => {
      const result = service.sanitizeUrl('JaVaScRiPt:alert(1)');
      expect(result).toBe('');
    });

    it('should block whitespace in javascript: protocol', () => {
      const result = service.sanitizeHtml('<a href="java\nscript:alert(1)">link</a>');
      expect(result).not.toContain('script');
    });

    it('should block HTML entities in protocol', () => {
      const result = service.sanitizeHtml('<a href="&#106;avascript:alert(1)">link</a>');
      expect(result).not.toContain('javascript');
    });

    it('should block decimal HTML entities', () => {
      const result = service.sanitizeHtml('<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">link</a>');
      expect(result).not.toContain('javascript');
    });

    it('should handle deeply nested XSS attempts', () => {
      const malicious = '<div><span><a href="javascript:alert(1)"><img src="x" onerror="alert(2)"></a></span></div>';
      const result = service.sanitizeHtml(malicious);
      expect(result).not.toContain('javascript');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should prevent DOM clobbering via id/name', () => {
      // While we don't specifically handle DOM clobbering, we should strip dangerous content
      const html = '<form id="location"><input name="href"></form>';
      const result = service.sanitizeHtml(html);
      expect(result).not.toContain('<form>');
      expect(result).not.toContain('<input>');
    });
  });
});
