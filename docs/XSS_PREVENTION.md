# XSS Prevention Strategy

<!-- This file will be regenerated during Operation Bedrock Phase 1.2 -->
<!-- Agent: security-specialist + technical-scribe -->

The sanitization approach uses **5 layers of defense** to prevent XSS attacks:

```
User Input
    ↓
Layer 1: sanitize-html library (tag/attribute stripping)
    ↓
Layer 2: Pattern-based event handler removal
    ↓
Layer 3: Dangerous protocol removal
    ↓
Layer 4: CSS pattern sanitization
    ↓
Layer 5: Navigation/redirection tag removal
    ↓
(Optional) Angular DomSanitizer integration
    ↓
Safe Output
```

## Implementation

### Core Methods

#### `sanitizeHtml(html: string): string`

The primary sanitization method that processes untrusted HTML through all security layers.

**Usage:**
```typescript
const safeHtml = validationService.sanitizeHtml(userInput);
```

**Security Features:**
- Removes all HTML tags (configured for plain text output)
- Strips event handlers (onclick, onerror, etc.)
- Blocks dangerous protocols (javascript:, data:, vbscript:, file:)
- Removes CSS-based attacks (expression, behavior, url())
- Eliminates navigation/redirection tags (meta, link, base)

#### `sanitizeHtmlForAngular(html: string): string`

Enhanced sanitization for Angular templates that combines our multi-layer approach with Angular's built-in DomSanitizer.

**Usage:**
```typescript
// In component
safeContent = this.validationService.sanitizeHtmlForAngular(userInput);

// In template
<div [innerHTML]="safeContent"></div>
```

**Additional Protection:**
- Processes through Angular's security context system
- Compatible with Angular's [innerHTML] binding
- Provides framework-level XSS protection

### Layer Details

#### Layer 1: sanitize-html Library

Uses the battle-tested `sanitize-html` library with strict configuration:

```typescript
sanitizeHtml(html, {
  allowedTags: [],              // No HTML tags allowed
  allowedAttributes: {},        // No attributes allowed
  disallowedTagsMode: 'discard', // Remove tags completely
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false
});
```

**Why this layer matters:**
- Industry-standard library with extensive testing
- Handles complex HTML parsing edge cases
- Removes dangerous content BEFORE it can be encoded

#### Layer 2: Event Handler Removal

Comprehensive regex patterns remove all event handlers:

```typescript
/\s*on\w+\s*=\s*["'][^"']*["']/gi  // onclick="...", onerror="..."
/\s*on\w+\s*=\s*[^\s>]*/gi         // onclick=... (unquoted)
```

**Protects against:**
- onclick, onerror, onload attacks
- Event handlers in various formats
- Case variations (onclick, onClick, ONCLICK)

#### Layer 3: Dangerous Protocol Removal

Blocks protocols commonly used in XSS attacks:

```typescript
const dangerousProtocols = [
  'javascript:', 'javascript&colon;', 'javascript&#58;', 'javascript&#x3a;',
  'data:', 'data&colon;', 'data&#58;', 'data&#x3a;',
  'vbscript:', 'vbscript&colon;', 'vbscript&#58;', 'vbscript&#x3a;',
  'file:', 'about:'
];
```

**Protects against:**
- javascript: pseudo-protocol attacks
- data: URL-based XSS
- vbscript: (legacy IE attacks)
- file: protocol (local file access)
- HTML entity encoded variations

#### Layer 4: CSS Pattern Sanitization

Removes dangerous CSS patterns:

```typescript
/\s*style\s*=\s*["'][^"']*(expression|behavior|binding|import|@import)[^"']*["']/gi
/url\s*\(\s*['"]?\s*(?:javascript:|data:|vbscript:)[^)]*['"]?\s*\)/gi
```

**Protects against:**
- CSS expression() attacks (legacy IE)
- CSS import-based attacks
- CSS url() with dangerous protocols

#### Layer 5: Navigation Tag Removal

Eliminates tags that could cause unwanted navigation or redirection:

```typescript
/<meta[\s\S]*?>/gi   // Meta refresh attacks
/<link[\s\S]*?>/gi   // External resource injection
/<base[\s\S]*?>/gi   // Base URL hijacking
```

## Additional Sanitization Methods

### `sanitizeString(input: string): string`

Removes control characters, zero-width characters, and normalizes Unicode:
- Null bytes and control characters
- Zero-width characters (used for obfuscation)
- Directional override characters (spoofing)
- Unicode normalization (NFC)

### `sanitizeUrl(url: string): string`

Validates and sanitizes URLs:
- Checks for dangerous protocols
- Validates URL structure
- Handles URL-encoded attacks
- Allows only safe protocols (http, https, mailto, blob)

### `sanitizeFilename(filename: string): string`

Prevents directory traversal and file system attacks:
- Removes path separators (/, \)
- Removes null bytes
- Strips leading dots
- Limits to safe characters
- Enforces length limits

## Testing

Comprehensive test coverage includes:

- Basic XSS vectors (script tags, event handlers)
- Encoded attacks (HTML entities, URL encoding)
- Protocol-based attacks (javascript:, data:, vbscript:)
- CSS-based attacks (expression, url())
- Navigation attacks (meta refresh, base href)
- Multiple simultaneous attack vectors
- Edge cases (empty input, whitespace, malformed HTML)

**Test Results:** 181/181 tests passing

## Security Principles

1. **Defense in Depth**: Multiple independent layers of protection
2. **Fail Secure**: Errors result in empty/safe output, not bypasses
3. **Whitelist Approach**: Allow only known-safe patterns
4. **Library + Custom**: Combine battle-tested libraries with custom validation
5. **Framework Integration**: Leverage Angular's built-in security features

## Best Practices

### Do's ✅

- Use `sanitizeHtml()` for all untrusted HTML input
- Use `sanitizeHtmlForAngular()` when binding to Angular templates
- Use `sanitizeString()` for plain text that might contain control characters
- Use `sanitizeUrl()` before using URLs in href or src attributes
- Use `sanitizeFilename()` before using filenames in file operations

### Don'ts ❌

- Don't trust user input without sanitization
- Don't bypass sanitization "just this once"
- Don't use [innerHTML] without sanitization
- Don't assume client-side validation is sufficient
- Don't remove sanitization layers to "improve performance"

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheats.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Angular Security Guide](https://angular.dev/best-practices/security)
- [sanitize-html Documentation](https://github.com/apostrophecms/sanitize-html)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## Maintenance

When updating XSS prevention:

1. Add new test cases for any new attack vectors discovered
2. Keep sanitize-html library updated to latest version
3. Review Angular security updates and recommendations
4. Monitor security advisories for new XSS techniques
5. Run security audits regularly with `npm audit`

## Support

For security concerns or questions:
- Review this documentation
- Check existing test cases for examples
- Consult the Angular security guide
- File security issues privately (not public GitHub issues)
