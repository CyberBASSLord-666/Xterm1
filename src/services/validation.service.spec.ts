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
      expect(result.errors.some((e) => e.includes('too long'))).toBe(true);
    });

    it('should reject prompt with too many special characters', () => {
      const specialChars = '!!!@@@###$$$%%%^^^&&&***';
      const result = service.validatePrompt(specialChars);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('special characters'))).toBe(true);
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
      expect(result.errors.some((e) => e.includes('protocol'))).toBe(true);
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
      expect(result.errors.some((e) => e.includes('positive'))).toBe(true);
    });

    it('should reject negative dimensions', () => {
      const result = service.validateDimensions(-1920, 1080);
      expect(result.isValid).toBe(false);
    });

    it('should reject too large dimensions', () => {
      const result = service.validateDimensions(10000, 10000);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too large'))).toBe(true);
    });

    it('should reject too small dimensions', () => {
      const result = service.validateDimensions(32, 32);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too small'))).toBe(true);
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
      expect(result).toContain('&lt;script&gt;');
    });

    it('should preserve text content', () => {
      const result = service.sanitizeHtml('plain text');
      expect(result).toBe('plain text');
    });

    it('should remove iframe tags', () => {
      const result = service.sanitizeHtml('<iframe src="malicious"></iframe>');
      expect(result).not.toContain('<iframe>');
    });

    it('should remove event handlers', () => {
      const result = service.sanitizeHtml('<div onclick="alert(1)">test</div>');
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const result = service.sanitizeHtml('<a href="javascript:alert(1)">link</a>');
      expect(result).not.toContain('javascript:');
    });

    it('should remove data: protocol', () => {
      const result = service.sanitizeHtml('<img src="data:text/html,<script>alert(1)</script>">');
      expect(result).not.toContain('data:');
    });

    it('should handle encoded attacks', () => {
      const result = service.sanitizeHtml('<a href="javascript&#58;alert(1)">link</a>');
      // The method escapes HTML entities which neutralizes the attack
      // All dangerous HTML tags and attributes are removed or escaped
      expect(result).not.toContain('<a href=');
      expect(result).not.toContain('javascript:');
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
      expect(result.errors.some((e) => e.includes('too short'))).toBe(true);
    });

    it('should reject invalid characters', () => {
      const result = service.validateApiKey('invalid key with spaces!!!');
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('invalid characters'))).toBe(true);
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

    it('should handle empty input', () => {
      const result = service.sanitizeFilename('');
      expect(result).toBe('file');
    });
  });
});
