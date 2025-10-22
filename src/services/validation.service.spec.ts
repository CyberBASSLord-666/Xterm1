import { TestBed } from '@angular/core/testing';
import { ValidationService } from './validation.service';

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
      expect(result.errors.some(e => e.includes('too long'))).toBe(true);
    });

    it('should reject prompt with too many special characters', () => {
      const specialChars = '!!!@@@###$$$%%%^^^&&&***';
      const result = service.validatePrompt(specialChars);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('special characters'))).toBe(true);
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
      expect(result.errors.some(e => e.includes('protocol'))).toBe(true);
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
      expect(result.errors.some(e => e.includes('positive'))).toBe(true);
    });

    it('should reject negative dimensions', () => {
      const result = service.validateDimensions(-1920, 1080);
      expect(result.isValid).toBe(false);
    });

    it('should reject too large dimensions', () => {
      const result = service.validateDimensions(10000, 10000);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too large'))).toBe(true);
    });

    it('should reject too small dimensions', () => {
      const result = service.validateDimensions(32, 32);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('too small'))).toBe(true);
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
  });

  describe('sanitizeHtml', () => {
    it('should remove dangerous markup entirely', () => {
      const result = service.sanitizeHtml('<script>alert("xss")</script>');
      expect(result).toBe('');
    });

    it('should preserve benign formatting and enforce safe link attributes', () => {
      const result = service.sanitizeHtml('<p>Hello <strong>world</strong> <a href="https://example.com" target="_blank" rel="nofollow">link</a></p>');

      expect(result).toContain('<p>');
      expect(result).toContain('<strong>world</strong>');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="nofollow noopener noreferrer"');
    });

    it('should strip unsupported attributes and invalid class values', () => {
      const result = service.sanitizeHtml('<span class="headline invalid!" onclick="alert(1)">News</span>');

      expect(result).toContain('<span class="headline">News</span>');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('invalid!');
    });
  });

  describe('sanitizeHtmlAdvanced', () => {
    it('should respect allowlist and remove unsafe URIs', () => {
      const html = '<div><strong>Bold</strong><a href="javascript:alert(1)" target="_self">Bad</a><a href="https://safe.test" target="_blank" rel="nofollow">Safe</a></div>';
      const result = service.sanitizeHtmlAdvanced(
        html,
        ['div', 'strong', 'a'],
        { 'a': ['href', 'target', 'rel'] }
      );

      expect(result).toContain('<div>');
      expect(result).toContain('</div>');
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<a target="_self">Bad</a>');
      expect(result).toContain('<a href="https://safe.test" target="_blank" rel="nofollow noopener noreferrer">Safe</a>');
      expect(result).not.toContain('javascript:');
    });

    it('should allow custom URL schemes when configured', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="mailto:test@example.com">Email</a>',
        ['a'],
        { 'a': ['href'] },
        { allowedUriSchemes: ['http', 'https', 'mailto'] }
      );

      expect(result).toBe('<a href="mailto:test@example.com">Email</a>');
    });

    it('should drop unsafe target when rel cannot be enforced', () => {
      const result = service.sanitizeHtmlAdvanced(
        '<a href="https://example.com" target="_blank">Link</a>',
        ['a'],
        { 'a': ['href', 'target'] }
      );

      expect(result).toBe('<a href="https://example.com">Link</a>');
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
      expect(result.errors.some(e => e.includes('too short'))).toBe(true);
    });

    it('should reject invalid characters', () => {
      const result = service.validateApiKey('invalid key with spaces!!!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid characters'))).toBe(true);
    });
  });
});
